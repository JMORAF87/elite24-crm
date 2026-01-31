import { getStore, makeId, readJson, json } from "./_store.js";

export default async function handler(req, res) {
  const store = getStore();

  if (req.method === "GET") {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const leadId = url.searchParams.get("leadId");
    const items = leadId ? store.activities.filter((a) => a.leadId === leadId) : store.activities;
    return json(res, 200, { activities: items });
  }

  if (req.method === "POST") {
    const body = await readJson(req);
    if (!body.leadId) return json(res, 400, { error: "leadId is required" });

    const activity = {
      id: makeId("act"),
      leadId: body.leadId,
      type: body.type || "NOTE",
      meta: body.meta || {},
      createdAt: new Date().toISOString(),
    };

    store.activities.unshift(activity);
    return json(res, 201, { activity });
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET,POST");
  return json(res, 405, { error: "Method not allowed" });
}
