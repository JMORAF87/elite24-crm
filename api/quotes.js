// api/quotes.js (CommonJS)
const { makeId, getStore, readJson, sendJson, handleOptions } = require("./_store");

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;

  try {
    const store = getStore();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const leadIdQ = url.searchParams.get("leadId") || url.searchParams.get("lead_id");

    if (req.method === "GET") {
      const quotes = leadIdQ ? store.quotes.filter((q) => q.leadId === leadIdQ) : store.quotes;
      return sendJson(res, 200, { quotes });
    }

    if (req.method === "POST") {
      const body = await readJson(req);

      const leadId = body.leadId || body.lead_id || leadIdQ;
      const service = body.service || body.serviceType || body.service_type || "";
      const guardType = body.guardType || body.guard_type || "";
      const hrsPerWeek = Number(body.hrsPerWeek ?? body.hoursPerWeek ?? body.hrs_week ?? 0);
      const rate = Number(body.rate ?? body.ratePerHour ?? body.rate_hr ?? 0);

      if (!leadId || !service || !guardType || !hrsPerWeek || !rate) {
        return sendJson(res, 400, { error: "leadId, service, guardType, hrsPerWeek, rate are required" });
      }

      const now = new Date().toISOString();
      const monthly = Math.round(hrsPerWeek * rate * 4.33 * 100) / 100;

      const quote = {
        id: makeId(),
        leadId,
        service,
        guardType,
        hrsPerWeek,
        rate,
        monthly,
        status: body.status || "DRAFT",
        createdAt: now,
      };

      store.quotes.unshift(quote);

      store.activities.unshift({
        id: makeId(),
        leadId,
        type: "QUOTE_CREATED",
        detail: `${service} / ${guardType} (${hrsPerWeek}h @ $${rate})`,
        createdAt: now,
      });

      return sendJson(res, 201, { quote, quotes: store.quotes.filter((q) => q.leadId === leadId) });
    }

    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error("quotes error:", err);
    return sendJson(res, 500, { error: "Internal server error", message: String(err?.message || err) });
  }
};
