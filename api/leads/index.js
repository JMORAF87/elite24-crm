// api/leads/index.js
const { listLeads, createLead } = require("../_store");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "GET") {
      const { page, limit, search, segment, priority, status } = req.query || {};
      const data = listLeads({ page, limit, search, segment, priority, status });
      return res.status(200).json({
        ...data,
        leads: data.items, // compatibility
      });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "object" ? req.body : {};
      const lead = createLead(body);
      return res.status(201).json({ lead });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "leads endpoint crashed" });
  }
};
