const { json, requireUser, CORS_HEADERS } = require("./_shared");

// 登入的人不再有自己的 GitHub 帳號/權限，所有實際寫入 GitHub 的動作都
// 改成呼叫這裡，用同一組藏在環境變數裡的服務帳號 token 執行——前提是
// 呼叫者要先通過 requireUser（帶有效的 Supabase 登入 token）。
const REPO_OWNER = "as-studio001";
const DEFAULT_REPO = "Internal-Pages";
const REPO_BRANCH = "main";

// 預設所有動作都寫進 Internal-Pages（後台自己的資料/程式碼）；只有「新增
// 子頁面」需要順便在 asstudiowebsite（子頁面實際部署的 repo）建立對應的
// .dc.html 骨架，才會帶 body.repo 指定寫到那邊。白名單是防呆，不讓呼叫者
// 透過這支 function 寫進服務帳號 token 能碰到的其他任意 repo。
// bamboo（as-studio001/bamboo，林鐵構竹展）2026-08-27 加入——那邊另外做了
// 一支獨立的後台頁面（bamboo repo 自己的 public/admin.html），跟這裡共用
// 同一個 Supabase 專案／同一批登入使用者、也共用這支 Netlify Function，
// 不重新申請一套後端，只是寫入的目標 repo 換成 bamboo 自己。
const ALLOWED_REPOS = new Set(["Internal-Pages", "asstudiowebsite", "bamboo"]);

function apiBase(repo) {
  return `https://api.github.com/repos/${REPO_OWNER}/${repo}`;
}

function encPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

// 安全防呆（2026-08-28 補上）：以前每支動作（getFile/putFile/deleteFile/
// uploadAsset/createBlob/commitBlobs）的 path/folder 完全信任前端傳來的
// 字串，只有 encPath() 把字元編碼過，沒有限制「這條路徑到底能不能碰」。
// 正常情況下後台只會透過既有的表單/按鈕呼叫，前端本身不會傳出危險路徑
// ——但這支 function 認證的是「這個 Supabase 使用者是不是登入中」，不是
// 「這個請求是不是真的從 admin/index.html 送出來的」：任何一個有效登入
// 帳號（後台目前沒有分級權限，邀請進來就是完整權限），只要照 API 格式
// 直接呼叫這支 function（例如用瀏覽器開發人員工具、或寫一支腳本），就
// 能繞過前端畫面，把 path 換成任意字串——沒有這道檢查的話，等於可以
// 用共用的 GITHUB_TOKEN 覆寫或刪除倉庫裡的任何檔案，包括這支 function
// 自己的原始碼（netlify/functions/*.js）、CI 設定（.github/）、甚至後台
// 網頁本身（admin/index.html），造成比「亂改案例內容」嚴重得多的後果
// （例如在這支 function 裡植入後門，之後所有存檔動作都被動手腳）。
// 這裡統一擋掉：路徑裡出現 ".." 這種可能用來跳出預期資料夾的片段一律
// 拒絕；已知這支 function 目前唯一合法會寫入的兩個 repo（Internal-Pages／
// asstudiowebsite）另外套用白名單，只放行實際會用到的資料夾/副檔名；
// bamboo（另一個團隊自己的系統共用同一支 function，我們不熟悉他們的
// 檔案結構，只套用上面的通用防呆，不額外限制資料夾）。
function assertSafePath(repo, path) {
  if (typeof path !== "string" || !path) throw new Error("path required");
  const segments = path.split("/");
  if (segments.some((seg) => seg === "." || seg === "..")) {
    throw new Error("path 不能包含 .. 這種跳出資料夾的片段");
  }
  if (path.startsWith("netlify/") || path === "netlify.toml" || path.startsWith(".github/")) {
    throw new Error("這條路徑不允許透過這支 function 寫入/刪除（觸碰到部署設定或 Function 原始碼本身）");
  }
  if (repo === "Internal-Pages") {
    if (path.startsWith("admin/")) throw new Error("不允許透過這支 function 改動後台網頁本身");
    if (!(path.startsWith("content/") || path.startsWith("images/"))) {
      throw new Error("Internal-Pages 只允許寫入 content/ 或 images/ 底下的檔案");
    }
  } else if (repo === "asstudiowebsite") {
    const isDcHtml = !path.includes("/") && path.endsWith(".dc.html");
    const isKnownRoot = path === "index.html" || path === "建築事務所首頁.dc.html";
    const isImages = path.startsWith("images/");
    if (!(isDcHtml || isKnownRoot || isImages)) {
      throw new Error("asstudiowebsite 只允許寫入根目錄的 .dc.html 頁面、首頁相關檔案，或 images/ 底下的檔案");
    }
  }
}

async function gh(repo, path, opts) {
  opts = opts || {};
  opts.headers = Object.assign(
    {
      Authorization: "token " + process.env.GITHUB_TOKEN,
      Accept: "application/vnd.github+json",
    },
    opts.headers || {}
  );
  return fetch(apiBase(repo) + path, opts);
}

async function ghJson(repo, path, opts) {
  const res = await gh(repo, path, opts);
  if (!res.ok) throw new Error(`GitHub API ${path} 失敗（${res.status}）：${await res.text()}`);
  return res.json();
}

// 把一批「已經建立好的 blob」實際寫進分支，一次 commit 搞定所有檔案。
// 讀分支目前的 tip、在它上面疊一個新 tree、包成新 commit，最後把分支
// 指標移過去——最後那一步（PATCH ref）是「樂觀鎖」：GitHub 只有在分支
// 沒被別人動過的情況下才會接受，這個系統常常有好幾個人／好幾個分頁
// 同時在用後台，中間這一瞬間分支被別人的存檔動過是真的會發生的事，
// 不是理論上的邊角案例——2026-08-28 就實際發生過一次，一次存 10 張
// 照片存到一半失敗。發生時 GitHub 會回 409/422，這裡改成：那種情況
// 直接重新讀一次最新的分支狀態、在新的基準上重做一次 tree/commit 再
// 試一次，最多重試幾次，而不是直接放棄讓使用者整個重來。
async function commitTreeEntries(repo, treeEntries, message, maxAttempts) {
  maxAttempts = maxAttempts || 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ref = await ghJson(repo, `/git/refs/heads/${REPO_BRANCH}`);
    const parentCommitSha = ref.object.sha;
    const parentCommit = await ghJson(repo, `/git/commits/${parentCommitSha}`);
    const newTree = await ghJson(repo, "/git/trees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: treeEntries }),
    });
    const newCommit = await ghJson(repo, "/git/commits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, tree: newTree.sha, parents: [parentCommitSha] }),
    });
    const patchRes = await gh(repo, `/git/refs/heads/${REPO_BRANCH}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha: newCommit.sha }),
    });
    if (patchRes.ok) return newCommit.sha;
    const status = patchRes.status;
    const errText = await patchRes.text();
    // 409/422 是「分支被別人動過，不是單純的快轉更新」——這種才值得
    // 重試；其他狀態碼（例如權杖失效的 401、根本沒權限的 403）重試也
    // 沒用，直接把錯誤丟出去讓使用者/工程師看得到真正的原因。
    if (attempt === maxAttempts || (status !== 409 && status !== 422)) {
      throw new Error(`更新分支失敗（${status}）：${errText}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
  }
}

// 影片／GIF 這類明顯偏大的檔案，改走 Git Data API 自己組一次 commit：
// 建 blob → 交給 commitTreeEntries() 疊進分支——不受 Contents API 單檔
// 大小上限。檔名衝突（極少見，時間戳記已經降低機率）一樣自動加時間
// 戳記重試一次。
async function uploadViaBlob(repo, path, base64Content, message) {
  const blob = await ghJson(repo, "/git/blobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: base64Content, encoding: "base64" }),
  });
  const attempt = async (targetPath) => {
    await commitTreeEntries(repo, [{ path: targetPath, mode: "100644", type: "blob", sha: blob.sha }], message);
  };
  try {
    await attempt(path);
    return path;
  } catch (e) {
    const parts = path.split("/");
    const filename = parts.pop();
    const altPath = [...parts, `${Date.now()}-${filename}`].join("/");
    await attempt(altPath);
    return altPath;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  if (event.httpMethod !== "POST") return json(405, { error: "method not allowed" });

  const { error } = await requireUser(event);
  if (error) return error;

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "bad json" });
  }

  let repo = DEFAULT_REPO;
  if (body.repo) {
    if (!ALLOWED_REPOS.has(body.repo)) return json(400, { error: "repo not allowed" });
    repo = body.repo;
  }

  try {
    if (body.action === "getFile") {
      assertSafePath(repo, body.path);
      const res = await gh(repo, `/contents/${encPath(body.path)}?ref=${REPO_BRANCH}&_=${Date.now()}`);
      if (!res.ok) return json(res.status, { error: await res.text() });
      return json(200, await res.json());
    }

    if (body.action === "listDir") {
      assertSafePath(repo, body.path);
      const res = await gh(repo, `/contents/${encPath(body.path)}?ref=${REPO_BRANCH}&_=${Date.now()}`);
      if (res.status === 404) return json(200, []);
      if (!res.ok) return json(res.status, { error: await res.text() });
      return json(200, await res.json());
    }

    if (body.action === "putFile") {
      assertSafePath(repo, body.path);
      const putBody = { message: body.message, content: body.content, branch: REPO_BRANCH };
      if (body.sha) putBody.sha = body.sha;
      const res = await gh(repo, `/contents/${encPath(body.path)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(putBody),
      });
      if (!res.ok) return json(res.status, { error: await res.text() });
      return json(200, await res.json());
    }

    if (body.action === "deleteFile") {
      assertSafePath(repo, body.path);
      const res = await gh(repo, `/contents/${encPath(body.path)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body.message, sha: body.sha, branch: REPO_BRANCH }),
      });
      if (!res.ok) return json(res.status, { error: await res.text() });
      return json(200, await res.json());
    }

    // 上傳一張照片：檔名衝突就自動加時間戳記重試一次，跟以前 client 端
    // uploadAsset 的行為一樣，只是現在改成一次 request 由這裡處理完。
    if (body.action === "uploadAsset") {
      const path = `${body.folder}/${body.filename}`;
      assertSafePath(repo, path);
      // 一般照片（已經過前端壓縮，通常遠小於 1MB）走這條路：GitHub 的
      // 「Create/Update file contents」這支 API 單次 PUT 有檔案大小上限
      // （官方文件寫明 base64 內容上限約 1MB），一般照片穩穩在門檻內，
      // 這條路徑維持原樣不動，降低影響既有穩定路徑的風險。
      if (!body.useBlob) {
        const putBody = { message: `Upload ${body.filename} via admin`, content: body.content, branch: REPO_BRANCH };
        let res = await gh(repo, `/contents/${encPath(path)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(putBody),
        });
        if (!res.ok) {
          const altPath = `${body.folder}/${Date.now()}-${body.filename}`;
          res = await gh(repo, `/contents/${encPath(altPath)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.assign({}, putBody, { message: putBody.message })),
          });
          if (!res.ok) return json(res.status, { error: await res.text() });
          return json(200, { path: altPath });
        }
        return json(200, { path });
      }

      // 影片／GIF 檔案（或任何前端判斷偏大的檔案）不透過上面那支 API，改
      // 用 Git Data API 自己組一次 commit（blob → tree → commit → 更新
      // ref）——這支路徑支援到 100MB，不會卡在 Contents API 那個較小的
      // 單檔限制。實際能上傳多大，還是受限於這支 Netlify Function 本身
      // 一次能收多大的 request（前端已經先擋掉過大的檔案，見
      // admin/index.html 的 assertUploadSize()）。
      const finalPath = await uploadViaBlob(repo, path, body.content, `Upload ${body.filename} via admin`);
      return json(200, { path: finalPath });
    }

    // 一次存檔要傳好幾張照片時，改用這兩支（createBlob → 逐一各自建立
    // blob，互相獨立、可以真的同時送出，不會搶著更新分支；commitBlobs →
    // 全部 blob 都建好之後再一次呼叫，把它們一起寫進「同一個 commit」）
    // 取代原本一張照片一次 commit 的做法——20 張照片以前是 20 次各自
    // 獨立的 commit（GitHub 對同一個分支密集連續寫入，容易彼此卡住甚至
    // 失敗），現在不管存幾張，永遠只有 1 次 commit，而且不會跟同一次存檔
    // 裡的其他照片互搶分支更新。
    if (body.action === "createBlob") {
      const blob = await ghJson(repo, "/git/blobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: body.content, encoding: "base64" }),
      });
      return json(200, { sha: blob.sha });
    }

    if (body.action === "commitBlobs") {
      const entries = body.entries || [];
      if (!entries.length) return json(400, { error: "no entries" });
      entries.forEach((e) => assertSafePath(repo, e.path));
      const treeEntries = entries.map((e) => ({ path: e.path, mode: "100644", type: "blob", sha: e.sha }));
      const commitSha = await commitTreeEntries(
        repo,
        treeEntries,
        body.message || `Upload ${entries.length} file(s) via admin`
      );
      return json(200, { ok: true, commit: commitSha });
    }

    return json(400, { error: "unknown action" });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
