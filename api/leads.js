// api/leads.js
import * as Store from "./_store.js";

// Works whether _store.js exports:
//   export const store = ...
// OR export default ...
const store = Store.store ?? Store.default ?? Store;

function getUrl(req) {
  // Works in Vercel/Node even if req.query is missing
  return new URL(req.url, "http://localhost");
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function asInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function getLeadsArray() {
  const leads =
    (store && Array.isArray(store.leads) && store.leads) ||
    (store && store.data && Array.isArray(store.data.leads) && store.data.leads) ||
    [];
  return leads;
}

function setLeadsArray(next) {
  if (store && Array.isArray(store.leads)) store.leads = next;
  else if (store && store.data && Array.isArray(store.data.leads)) store.data.leads = next;
  else {
    // last resort: create store.leads
    if (store && typeof store === "object") store.leads = next;
  }
}

export default async function handler(req, res) {
  try {
    const url = getUrl(req);

    // ---- GET list or single ----
    if (req.method === "GET") {
      const id =
        url.searchParams.get("id") ||
        url.searchParams.get("leadId") ||
        url.searchParams.get("leadID"); // tolerate casing

      const all = getLeadsArray();

      // Single lead
      if (id) {
        const lead = all.find((l) => String(l?.id) === String(id));
        return json(res, 200, { ok: true, lead: lead || null });
      }

      // List leads
      const limit = asInt(url.searchParams.get("limit") || "50", 50);
      const page = asInt(url.searchParams.get("page") || "1", 1);
      const search = (url.searchParams.get("search") || "").trim().toLowerCase();

      let filtered = all;

      if (search) {
        filtered = all.filter((l) => {
          const hay = [
            l?.name,
            l?.company,
            l?.city,
            l?.state,
            l?.email,
            l?.phone,
            l?.segment,
            l?.focus,
            l?.website,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(search);
        });
      }

      const start = (page - 1) * limit;
      const items = filtered.slice(start, start + limit);

      // IMPORTANT: return `leads` for your UI
      return json(res, 200, {
        ok: true,
        leads: items,
        items, // keep both to be safe
        total: filtered.length,
        page,
        limit,
      });
    }

    // ---- POST create ----
    if (req.method === "POST") {
      const body = req.body || {};
      const all = getLeadsArray();

      const id = body.id || (globalThis.crypto?.randomUUID?.() ?? String(Date.now()));
      const now = new Date().toISOString();

      const lead = {
        id,
        status: body.status || "NEW",
        priority: body.priority || "MEDIUM",
        createdAt: body.createdAt || now,
        updatedAt: now,
        ...body,
        id, // ensure id wins
      };

      setLeadsArray([lead, ...all]);
      return json(res, 200, { ok: true, lead });
    }

    // ---- PATCH update ----
    if (req.method === "PATCH") {
      const body = req.body || {};
      const id = body.id || body.leadId || body.leadID;

      if (!id) {
        return json(res, 400, { ok: false, error: "Missing id (or leadId) in PATCH body" });
      }

      const all = getLeadsArray();
      const idx = all.findIndex((l) => String(l?.id) === String(id));

      if (idx === -1) {
        return json(res, 404, { ok: false, error: "Lead not found", id });
      }

      const now = new Date().toISOString();
      const updated = {
        ...all[idx],
        ...body,
        id: all[idx].id, // never change id
        updatedAt: now,
      };

      const next = [...all];
      next[idx] = updated;
      setLeadsArray(next);

      return json(res, 200, { ok: true, lead: updated });
    }

    res.setHeader("Allow", "GET,POST,PATCH");
    return json(res, 405, { ok: false, error: "Method not allowed" });
  } catch (err) {
    // This is what’s currently causing your “blank” pages.
    return json(res, 500, {
      ok: false,
      error: err?.message || "Unknown server error",
    });
  }
}
