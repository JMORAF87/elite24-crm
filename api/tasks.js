// api/tasks.js (CommonJS)
const { makeId, getStore, readJson, sendJson, handleOptions } = require("./_store");

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;

  try {
    const store = getStore();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const leadIdQ = url.searchParams.get("leadId") || url.searchParams.get("lead_id");

    if (req.method === "GET") {
      const tasks = leadIdQ ? store.tasks.filter((t) => t.leadId === leadIdQ) : store.tasks;
      return sendJson(res, 200, { tasks });
    }

    if (req.method === "POST") {
      const body = await readJson(req);

      const leadId = body.leadId || body.lead_id || leadIdQ;
      const title = body.title || body.name || body.task || "";
      const dueDate = body.dueDate || body.due || body.date || null;

      if (!leadId || !title) {
        return sendJson(res, 400, { error: "leadId and title are required" });
      }

      const now = new Date().toISOString();
      const task = {
        id: makeId(),
        leadId,
        title,
        dueDate,
        completed: false,
        createdAt: now,
      };

      store.tasks.unshift(task);

      // Activity log (optional but helps “tracking”)
      store.activities.unshift({
        id: makeId(),
        leadId,
        type: "TASK_CREATED",
        detail: title,
        createdAt: now,
      });

      return sendJson(res, 201, { task, tasks: store.tasks.filter((t) => t.leadId === leadId) });
    }

    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("tasks error:", err);
    return sendJson(res, 500, { error: "Internal server error", message: String(err?.message || err) });
  }
};
