// 讓後台介面裡就能「新增／移除可登入的使用者」，不用每次都跑去 Netlify
// 官方後台手動邀請。這支 function 跑在跟 Identity 同一個 Netlify 網站
// 上，Netlify 會自動把一個「短效期的管理員 token」放進
// context.clientContext.identity，讓我們可以用它去打 GoTrue 的管理
// API（/admin/users、/invite），不需要自己另外存一組密鑰。
//
// 呼叫這支 function 的人自己也要先登入（帶著自己的 Identity token），
// 這裡只檢查「有沒有登入」，沒有做角色分級——這個後台目前是小團隊用，
// 只要能登入案例後台的人，就都能新增/移除其他登入帳號。
function json(statusCode, obj) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) };
}

exports.handler = async (event, context) => {
  const { identity, user } = context.clientContext || {};
  if (!user) return json(401, { message: "請先登入" });
  if (!identity) return json(500, { message: "這個網站沒有啟用 Identity" });

  const authHeaders = { Authorization: `Bearer ${identity.token}` };

  try {
    if (event.httpMethod === "GET") {
      const res = await fetch(`${identity.url}/admin/users`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) return json(res.status, data);
      return json(200, data);
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");

      if (body.action === "invite") {
        if (!body.email) return json(400, { message: "缺少 email" });
        const res = await fetch(`${identity.url}/invite`, {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ email: body.email }),
        });
        const data = await res.json();
        if (!res.ok) return json(res.status, data);
        return json(200, data);
      }

      if (body.action === "remove") {
        if (!body.id) return json(400, { message: "缺少使用者 id" });
        const res = await fetch(`${identity.url}/admin/users/${body.id}`, {
          method: "DELETE",
          headers: authHeaders,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return json(res.status, data);
        }
        return json(200, { ok: true });
      }

      return json(400, { message: "不認得的 action" });
    }

    return json(405, { message: "Method not allowed" });
  } catch (err) {
    return json(500, { message: err.message });
  }
};
