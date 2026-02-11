// api/leads/[id].js
const { getLeadById, updateLead } = require("../_store");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const raw = req.query && req.query.id;
  const id = Array.isArray(raw) ? raw[0] : raw;

  try {
    if (!id) return res.status(400).json({ error: "Missing lead id" });

    if (req.method === "GET") {
      const lead = getLeadById(id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      return res.status(200).json({ lead });
    }

    if (req.method === "PATCH") {
      const patch = req.body && typeof req.body === "object" ? req.body : {};
      const lead = updateLead(id, patch);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      return res.status(200).json({ lead });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("api/leads/[id] crashed", e);
    return res.status(500).json({ error: "Lead id endpoint crashed" });
  }
};
