const { json, requireUser, CORS_HEADERS } = require("./_shared");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  if (event.httpMethod !== "POST") return json(405, { error: "method not allowed" });

  const { user, admin, error } = await requireUser(event);
  if (error) return error;

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "bad json" });
  }
  const userId = body.userId;
  if (!userId) return json(400, { error: "userId required" });
  if (userId === user.id) return json(400, { error: "不能移除自己目前登入的帳號" });

  // 不能刪到剩 0 個人，不然沒人進得去後台改回來
  const { data: listData, error: listError } = await admin.auth.admin.listUsers();
  if (listError) return json(400, { error: listError.message });
  if (listData.users.length <= 1) return json(400, { error: "至少要留一個帳號" });

  const { error: delError } = await admin.auth.admin.deleteUser(userId);
  if (delError) return json(400, { error: delError.message });
  return json(200, { ok: true });
};
