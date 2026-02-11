// api/activities.js
const { addActivity, listActivities } = require("./_store");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "GET") {
      const { leadId, limit } = req.query || {};
      if (!leadId) return res.status(400).json({ error: "Missing leadId" });

      const items = listActivities(leadId, limit);
      return res.status(200).json({ items, activities: items });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "object" ? req.body : {};
      const { leadId, type, message, meta } = body;

      if (!leadId) return res.status(400).json({ error: "Missing leadId" });

      const activity = addActivity({ leadId, type, message, meta });
      return res.status(201).json({ activity });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "activities endpoint crashed" });
  }
};
