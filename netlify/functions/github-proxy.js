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

// 影片／GIF 這類明顯偏大的檔案，改走 Git Data API 自己組一次 commit：
// 建 blob → 讀目前分支最新 commit 的 tree → 建一個只多這一個檔案的新
// tree → 用新 tree 建一個新 commit → 把分支指標移到這個新 commit。
// 四個步驟串起來等於「加一個檔案」，但不受 Contents API 單檔大小上限。
// 檔名衝突（極少見，時間戳記已經降低機率）一樣自動加時間戳記重試一次。
async function uploadViaBlob(repo, path, base64Content, message) {
  const attempt = async (targetPath) => {
    const blob = await ghJson(repo, "/git/blobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: base64Content, encoding: "base64" }),
    });
    const ref = await ghJson(repo, `/git/refs/heads/${REPO_BRANCH}`);
    const parentCommitSha = ref.object.sha;
    const parentCommit = await ghJson(repo, `/git/commits/${parentCommitSha}`);
    const newTree = await ghJson(repo, "/git/trees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base_tree: parentCommit.tree.sha,
        tree: [{ path: targetPath, mode: "100644", type: "blob", sha: blob.sha }],
      }),
    });
    const newCommit = await ghJson(repo, "/git/commits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, tree: newTree.sha, parents: [parentCommitSha] }),
    });
    await ghJson(repo, `/git/refs/heads/${REPO_BRANCH}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sha: newCommit.sha }),
    });
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
      const res = await gh(repo, `/contents/${encPath(body.path)}?ref=${REPO_BRANCH}&_=${Date.now()}`);
      if (!res.ok) return json(res.status, { error: await res.text() });
      return json(200, await res.json());
    }

    if (body.action === "listDir") {
      const res = await gh(repo, `/contents/${encPath(body.path)}?ref=${REPO_BRANCH}&_=${Date.now()}`);
      if (res.status === 404) return json(200, []);
      if (!res.ok) return json(res.status, { error: await res.text() });
      return json(200, await res.json());
    }

    if (body.action === "putFile") {
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

    return json(400, { error: "unknown action" });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
