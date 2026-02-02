// api/quotes.js
import store, { isoNow, uid } from "./_store.js";

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

function num(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

export default async function handler(req, res) {
  try {
    const url = getUrl(req);
    const leadId = url.searchParams.get("leadId") || undefined;
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Math.max(0, Number(limitRaw) || 0) : 0;

    if (req.method === "GET") {
      let quotes = Array.isArray(store.quotes) ? store.quotes : [];
      if (leadId) quotes = quotes.filter((q) => q.leadId === leadId);

      quotes = quotes.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      if (limit) quotes = quotes.slice(0, limit);

      return res.status(200).json({ ok: true, quotes });
    }

    if (req.method === "POST") {
      const body = await getJsonBody(req);
      const finalLeadId = body.leadId || leadId;

      if (!finalLeadId) {
        return res.status(400).json({ ok: false, error: "Missing leadId" });
      }

      // keep flexible so it matches your UI payload
      const service = (body.service || "").toString().trim();
      const guardType = (body.guardType || body.guard || "").toString().trim();
      const hrsPerWeek = num(body.hrsPerWeek ?? body.hoursPerWeek ?? body.hours, 0);
      const ratePerHr = num(body.ratePerHr ?? body.rate ?? body.hourlyRate, 0);

      const quote = {
        id: uid("quote_"),
        leadId: finalLeadId,
        status: (body.status || "DRAFT").toString(),
        service,
        guardType,
        hrsPerWeek,
        ratePerHr,
        estimatedMonthly: num(body.estimatedMonthly, hrsPerWeek * ratePerHr * 4.33),
        createdAt: isoNow(),
        updatedAt: isoNow(),
      };

      store.quotes = Array.isArray(store.quotes) ? store.quotes : [];
      store.quotes.unshift(quote);

      return res.status(200).json({ ok: true, quote });
    }

    res.statusCode = 405;
    res.setHeader("Allow", "GET, POST");
    return res.json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Server error in /api/quotes",
    });
  }
}
