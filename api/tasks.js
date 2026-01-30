import { getStore, makeId, readJson, json } from "./_store.js";

export default async function handler(req, res) {
  const store = getStore();

  if (req.method === "GET") {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const leadId = url.searchParams.get("leadId");
    const items = leadId ? store.tasks.filter((t) => t.leadId === leadId) : store.tasks;
    return json(res, 200, { tasks: items });
  }

  if (req.method === "POST") {
    const body = await readJson(req);
    const task = {
      id: makeId("task"),
      leadId: body.leadId,
      title: body.title || "Task",
      dueDate: body.dueDate || null,
      status: body.status || "OPEN",
      createdAt: new Date().toISOString(),
    };
    if (!task.leadId) return json(res, 400, { error: "leadId is required" });

    store.tasks.unshift(task);
    return json(res, 201, { task });
  }

  if (req.method === "PATCH") {
    const body = await readJson(req);
    if (!body.id) return json(res, 400, { error: "id is required" });

    const idx = store.tasks.findIndex((t) => t.id === body.id);
    if (idx === -1) return json(res, 404, { error: "task not found" });

    store.tasks[idx] = { ...store.tasks[idx], ...body, updatedAt: new Date().toISOString() };
    return json(res, 200, { task: store.tasks[idx] });
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET,POST,PATCH");
  return json(res, 405, { error: "Method not allowed" });
}
