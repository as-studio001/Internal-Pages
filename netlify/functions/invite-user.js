const { json, requireUser, CORS_HEADERS } = require("./_shared");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  if (event.httpMethod !== "POST") return json(405, { error: "method not allowed" });

  const { admin, error } = await requireUser(event);
  if (error) return error;

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "bad json" });
  }
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) return json(400, { error: "email required" });

  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
  if (inviteError) return json(400, { error: inviteError.message });
  return json(200, { ok: true, userId: data.user.id, email: data.user.email });
};
