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
const ALLOWED_REPOS = new Set(["Internal-Pages", "asstudiowebsite"]);

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

    return json(400, { error: "unknown action" });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
