// api/leads.js
import { store } from "./_store.js";

function toInt(v, fallback) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function safeLower(s) {
  return String(s ?? "").toLowerCase();
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const {
        id,
        leadId,
        status,
        segment,
        priority,
        q,
        page = "1",
        limit = "200",
      } = req.query || {};

      const wantedId = leadId || id;

      // Base list
      let leads = Array.isArray(store?.leads) ? store.leads : [];

      // Single lead fetch (optional)
      if (wantedId) {
        const lead = leads.find((l) => l?.id === wantedId);
        if (!lead) return res.status(404).json({ ok: false, error: "Lead not found", leadId: wantedId });
        return res.status(200).json({ ok: true, lead });
      }

      // Filters
      if (status) leads = leads.filter((l) => safeLower(l?.status) === safeLower(status));
      if (segment) leads = leads.filter((l) => safeLower(l?.segment) === safeLower(segment));
      if (priority) leads = leads.filter((l) => safeLower(l?.priority) === safeLower(priority));

      if (q) {
        const qq = safeLower(q);
        leads = leads.filter((l) => {
          const name = safeLower(l?.name);
          const website = safeLower(l?.website);
          const city = safeLower(l?.city);
          const state = safeLower(l?.state);
          return (
            name.includes(qq) ||
            website.includes(qq) ||
            city.includes(qq) ||
            state.includes(qq)
          );
        });
      }

      // Pagination
      const p = Math.max(1, toInt(page, 1));
      const lim = Math.max(1, Math.min(500, toInt(limit, 200)));
      const total = leads.length;
      const start = (p - 1) * lim;
      const items = leads.slice(start, start + lim);

      return res.status(200).json({
        ok: true,
        items,
        total,
        page: p,
        limit: lim,
      });
    }

    if (req.method === "PATCH") {
      // Vercel gives req.body already parsed most of the time; still guard:
      let body = req.body;
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { body = {}; }
      }

      const targetId = body?.leadId || body?.id;
      if (!targetId) {
        return res.status(400).json({ ok: false, error: "Missing leadId" });
      }

      const patch = body?.updates && typeof body.updates === "object" ? body.updates : body;

      if (!Array.isArray(store.leads)) store.leads = [];
      const idx = store.leads.findIndex((l) => l?.id === targetId);

      if (idx === -1) {
        return res.status(404).json({ ok: false, error: "Lead not found", leadId: targetId });
      }

      // Do NOT allow id overwrite
      const { id, leadId, ...rest } = patch || {};
      store.leads[idx] = { ...store.leads[idx], ...rest };

      return res.status(200).json({ ok: true, lead: store.leads[idx] });
    }

    res.setHeader("Allow", "GET, PATCH");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unhandled error in /api/leads",
    });
  }
}
