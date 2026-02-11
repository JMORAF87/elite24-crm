// api/quotes.js
const { addQuote, listQuotes } = require("./_store");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "GET") {
      const { leadId, limit } = req.query || {};
      if (!leadId) return res.status(400).json({ error: "Missing leadId" });

      const items = listQuotes(leadId, limit);
      return res.status(200).json({ items, quotes: items });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "object" ? req.body : {};
      const { leadId, service, guardType, hoursPerWeek, ratePerHour, status } = body;

      if (!leadId) return res.status(400).json({ error: "Missing leadId" });

      const quote = addQuote({ leadId, service, guardType, hoursPerWeek, ratePerHour, status });
      return res.status(201).json({ quote });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "quotes endpoint crashed" });
  }
};
