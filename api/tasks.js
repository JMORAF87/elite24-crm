// api/tasks.js
import store, { isoNow, uid, toDateOnly } from "./_store.js";

function getUrl(req) {
  return new URL(req.url, `http://${req.headers.host}`);
}

async function getJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  try {
    const url = getUrl(req);
    const leadId = url.searchParams.get("leadId") || undefined;
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Math.max(0, Number(limitRaw) || 0) : 0;

    if (req.method === "GET") {
      let tasks = Array.isArray(store.tasks) ? store.tasks : [];
      if (leadId) tasks = tasks.filter((t) => t.leadId === leadId);

      tasks = tasks.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      if (limit) tasks = tasks.slice(0, limit);

      return res.status(200).json({ ok: true, tasks });
    }

    if (req.method === "POST") {
      const body = await getJsonBody(req);

      const finalLeadId = body.leadId || leadId;
      const title = (body.title || body.name || "").toString().trim();
      const dueDate = toDateOnly(body.dueDate || body.due || body.date);

      if (!finalLeadId || !title) {
        return res.status(400).json({
          ok: false,
          error: "Missing required fields: leadId and title",
          received: { leadId: !!finalLeadId, title: !!title },
        });
      }

      const task = {
        id: uid("task_"),
        leadId: finalLeadId,
        title,
        dueDate,
        completed: false,
        createdAt: isoNow(),
        updatedAt: isoNow(),
      };

      store.tasks = Array.isArray(store.tasks) ? store.tasks : [];
      store.tasks.unshift(task);

      return res.status(200).json({ ok: true, task });
    }

    res.statusCode = 405;
    res.setHeader("Allow", "GET, POST");
    return res.json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Server error in /api/tasks",
    });
  }
}
