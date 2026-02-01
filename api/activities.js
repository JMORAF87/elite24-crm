// api/activities.js (CommonJS)
const { makeId, getStore, readJson, sendJson, handleOptions } = require("./_store");

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;

  try {
    const store = getStore();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const leadId = url.searchParams.get("leadId") || url.searchParams.get("lead_id");

    if (req.method === "GET") {
      const activities = leadId ? store.activities.filter((a) => a.leadId === leadId) : store.activities;
      return sendJson(res, 200, { activities });
    }

    if (req.method === "POST") {
      const body = await readJson(req);
      if (!body.leadId || !body.type) return sendJson(res, 400, { error: "leadId and type required" });

      const now = new Date().toISOString();
      const activity = {
        id: makeId(),
        leadId: body.leadId,
        type: body.type,
        detail: body.detail || "",
        createdAt: now,
      };
      store.activities.unshift(activity);
      return sendJson(res, 201, { activity });
    }

    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("activities error:", err);
    return sendJson(res, 500, { error: "Internal server error", message: String(err?.message || err) });
  }
};
