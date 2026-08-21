const { createClient } = require("@supabase/supabase-js");

// 後台網頁（GitHub Pages）跟這個 Netlify function 不同網域，所以每個
// function 都要處理 CORS，不然瀏覽器會擋住 fetch。
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status, body) {
  return {
    statusCode: status,
    headers: Object.assign({ "Content-Type": "application/json" }, CORS_HEADERS),
    body: JSON.stringify(body),
  };
}

function supabaseAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// 每個 function 都要先確認呼叫者帶的是一個「登入中」的 Supabase 使用者
// token，不是隨便誰都能呼叫這些 function（尤其 invite / 寫 GitHub 這種）。
// 用 service role client 驗證別人的 token 是合法的做法。
async function requireUser(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: json(401, { error: "missing token" }) };
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data || !data.user) return { error: json(401, { error: "invalid token" }) };
  return { user: data.user, admin };
}

module.exports = { CORS_HEADERS, json, supabaseAdmin, requireUser };
