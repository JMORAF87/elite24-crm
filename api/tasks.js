// api/tasks.js (Vercel Node Serverless Function)

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function getQuery(req) {
  // req.url is relative on Vercel; URL() needs a base
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  return url.searchParams;
}

function makeId(prefix = "task") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default async function handler(req, res) {
  try {
    if (!globalThis.__elite24_tasks) globalThis.__elite24_tasks = [];
    const tasks = globalThis.__elite24_tasks;

    const method = req.method || "GET";
    const q = getQuery(req);

    if (method === "GET") {
      const leadId = q.get("leadId");
      const out = leadId ? tasks.filter((t) => t.leadId === leadId) : tasks;
      return sendJson(res, 200, out);
    }

    if (method === "POST") {
      const body = await readJson(req);
      const { leadId, title, dueDate } = body || {};

      if (!leadId || !title) {
        return sendJson(res, 400, { error: "leadId and title are required" });
      }

      const task = {
        id: makeId("task"),
        leadId,
        title,
        dueDate: dueDate || null,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      tasks.unshift(task);
      return sendJson(res, 201, task);
    }

    if (method === "PATCH") {
      const body = await readJson(req);
      const { id, completed, title, dueDate } = body || {};
      if (!id) return sendJson(res, 400, { error: "id is required" });

      const idx = tasks.findIndex((t) => t.id === id);
      if (idx === -1) return sendJson(res, 404, { error: "task not found" });

      tasks[idx] = {
        ...tasks[idx],
        ...(typeof completed === "boolean" ? { completed } : {}),
        ...(typeof title === "string" ? { title } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
        updatedAt: new Date().toISOString(),
      };

      return sendJson(res, 200, tasks[idx]);
    }

    if (method === "DELETE") {
      const body = await readJson(req);
      const { id } = body || {};
      if (!id) return sendJson(res, 400, { error: "id is required" });

      const before = tasks.length;
      globalThis.__elite24_tasks = tasks.filter((t) => t.id !== id);
      return sendJson(res, 200, { deleted: before - globalThis.__elite24_tasks.length });
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("api/tasks error:", err);
    return sendJson(res, 500, { error: "Internal Server Error" });
  }
}
