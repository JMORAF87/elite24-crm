// api/activities.js
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

export default async function handler(req, res) {
  try {
    const url = getUrl(req);
    const leadId = url.searchParams.get("leadId") || undefined;
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Math.max(0, Number(limitRaw) || 0) : 0;

    if (req.method === "GET") {
      let activities = Array.isArray(store.activities) ? store.activities : [];
      if (leadId) activities = activities.filter((a) => a.leadId === leadId);

      activities = activities.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      if (limit) activities = activities.slice(0, limit);

      return res.status(200).json({ ok: true, activities });
    }

    if (req.method === "POST") {
      const body = await getJsonBody(req);
      const finalLeadId = body.leadId || leadId;

      if (!finalLeadId) {
        return res.status(400).json({ ok: false, error: "Missing leadId" });
      }

      const activity = {
        id: uid("act_"),
        leadId: finalLeadId,
        type: (body.type || body.kind || "note").toString(),
        title: (body.title || body.message || "").toString(),
        meta: body.meta ?? null,
        createdAt: isoNow(),
      };

      store.activities = Array.isArray(store.activities) ? store.activities : [];
      store.activities.unshift(activity);

      // optional meta tracking
      store.leadMeta = store.leadMeta && typeof store.leadMeta === "object" ? store.leadMeta : {};
      const m = store.leadMeta[finalLeadId] || { attempts: 0, lastAttemptAt: null };
      if (activity.type === "email_sent") {
        m.attempts = (m.attempts || 0) + 1;
        m.lastAttemptAt = isoNow();
      }
      store.leadMeta[finalLeadId] = m;

      return res.status(200).json({ ok: true, activity });
    }

    res.statusCode = 405;
    res.setHeader("Allow", "GET, POST");
    return res.json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Server error in /api/activities",
    });
  }
}
