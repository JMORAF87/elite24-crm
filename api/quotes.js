import { getStore, makeId, readJson, json } from "./_store.js";

export default async function handler(req, res) {
  const store = getStore();

  if (req.method === "GET") {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const leadId = url.searchParams.get("leadId");
    const items = leadId ? store.quotes.filter((q) => q.leadId === leadId) : store.quotes;
    return json(res, 200, { quotes: items });
  }

  if (req.method === "POST") {
    const body = await readJson(req);
    const quote = {
      id: makeId("quote"),
      leadId: body.leadId,
      service: body.service || "",
      guardType: body.guardType || "",
      hrsPerWeek: Number(body.hrsPerWeek || 0),
      rate: Number(body.rate || 0),
      status: body.status || "DRAFT",
      createdAt: new Date().toISOString(),
    };
    if (!quote.leadId) return json(res, 400, { error: "leadId is required" });

    store.quotes.unshift(quote);
    return json(res, 201, { quote });
  }

  if (req.method === "PATCH") {
    const body = await readJson(req);
    if (!body.id) return json(res, 400, { error: "id is required" });

    const idx = store.quotes.findIndex((q) => q.id === body.id);
    if (idx === -1) return json(res, 404, { error: "quote not found" });

    store.quotes[idx] = { ...store.quotes[idx], ...body, updatedAt: new Date().toISOString() };
    return json(res, 200, { quote: store.quotes[idx] });
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET,POST,PATCH");
  return json(res, 405, { error: "Method not allowed" });
}
