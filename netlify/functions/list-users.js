const { json, requireUser, CORS_HEADERS } = require("./_shared");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS_HEADERS, body: "" };

  const { admin, error } = await requireUser(event);
  if (error) return error;

  const { data, error: listError } = await admin.auth.admin.listUsers();
  if (listError) return json(400, { error: listError.message });

  const users = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    invited: !u.last_sign_in_at,
  }));
  return json(200, { users });
};
