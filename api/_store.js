// api/_store.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const TMP_PATH = path.join("/tmp", "elite24-store.json");

let state = null;

function now() {
  return new Date().toISOString();
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function readFileIfExists(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function writeFileSafe(p, data) {
  try {
    fs.writeFileSync(p, data, "utf8");
  } catch {
    // serverless best-effort
  }
}

function normalizeLead(raw) {
  const id = raw.id || raw.leadId || raw.uuid || crypto.randomUUID();
  const createdAt = raw.createdAt || now();
  const updatedAt = raw.updatedAt || createdAt;

  return {
    id,
    company: raw.company || raw.name || "Untitled",
    contactName: raw.contactName || raw.contact || "",
    email: raw.email || "",
    phone: raw.phone || "",
    website: raw.website || raw.url || "",
    city: raw.city || "",
    state: raw.state || "",
    segment: raw.segment || "GC",
    priority: (raw.priority || "MEDIUM").toUpperCase(),
    status: (raw.status || "NEW").toUpperCase(),
    focus: raw.focus || "",
    rating: raw.rating || raw.reviews || "",
    createdAt,
    updatedAt,
    ...raw,
    id, // ensure id wins
    createdAt,
    updatedAt,
  };
}

function seedLeadsFromRepo() {
  const candidates = [
    path.join(process.cwd(), "data", "leads.json"),
    path.join(process.cwd(), "src", "data", "leads.json"),
    path.join(process.cwd(), "public", "leads.json"),
  ];

  for (const p of candidates) {
    const txt = readFileIfExists(p);
    if (!txt) continue;
    const parsed = safeJsonParse(txt, null);
    if (!parsed) continue;

    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed.leads) ? parsed.leads : null;
    if (!arr) continue;

    return arr.map(normalizeLead);
  }

  return [];
}

function loadState() {
  // 1) warm memory
  if (state) return state;

  // 2) tmp persisted (best-effort)
  const tmpTxt = readFileIfExists(TMP_PATH);
  if (tmpTxt) {
    const parsed = safeJsonParse(tmpTxt, null);
    if (parsed && parsed.leads && parsed.tasks && parsed.quotes && parsed.activities) {
      state = parsed;
      return state;
    }
  }

  // 3) repo seed
  const leads = seedLeadsFromRepo();

  state = {
    leads,
    tasks: [],
    quotes: [],
    activities: [],
    meta: { createdAt: now(), updatedAt: now() },
  };

  persist();
  return state;
}

function persist() {
  if (!state) return;
  state.meta = state.meta || {};
  state.meta.updatedAt = now();
  writeFileSafe(TMP_PATH, JSON.stringify(state, null, 2));
}

function getState() {
  return loadState();
}

function listLeads({ page = 1, limit = 50, search = "", segment, priority, status } = {}) {
  const s = getState();

  let items = [...s.leads];

  if (segment && segment !== "ALL") {
    items = items.filter((l) => String(l.segment || "").toUpperCase() === String(segment).toUpperCase());
  }

  if (priority && priority !== "ALL") {
    items = items.filter((l) => String(l.priority || "").toUpperCase() === String(priority).toUpperCase());
  }

  if (status && status !== "ALL") {
    items = items.filter((l) => String(l.status || "").toUpperCase() === String(status).toUpperCase());
  }

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter((l) => {
      const hay = [
        l.company,
        l.contactName,
        l.email,
        l.phone,
        l.city,
        l.state,
        l.website,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  const total = items.length;
  const p = Math.max(1, Number(page) || 1);
  const lim = Math.max(1, Math.min(500, Number(limit) || 50));
  const start = (p - 1) * lim;
  const paged = items.slice(start, start + lim);

  return { items: paged, total, page: p, limit: lim };
}

function getLeadById(id) {
  const s = getState();
  return s.leads.find((l) => l.id === id) || null;
}

function createLead(payload) {
  const s = getState();
  const lead = normalizeLead(payload || {});
  s.leads.unshift(lead);
  persist();
  return lead;
}

function updateLead(id, patch) {
  const s = getState();
  const idx = s.leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  const next = {
    ...s.leads[idx],
    ...(patch || {}),
    id,
    updatedAt: now(),
  };

  // normalize key fields a bit
  if (next.status) next.status = String(next.status).toUpperCase();
  if (next.priority) next.priority = String(next.priority).toUpperCase();

  s.leads[idx] = next;
  persist();
  return next;
}

function addActivity({ leadId, type, message, meta } = {}) {
  const s = getState();
  const item = {
    id: crypto.randomUUID(),
    leadId: leadId || null,
    type: type || "note",
    message: message || "",
    meta: meta || {},
    createdAt: now(),
  };
  s.activities.unshift(item);
  persist();
  return item;
}

function listActivities(leadId, limit = 50) {
  const s = getState();
  const lim = Math.max(1, Math.min(200, Number(limit) || 50));
  const items = s.activities.filter((a) => a.leadId === leadId).slice(0, lim);
  return items;
}

function addTask({ leadId, title, dueDate } = {}) {
  const s = getState();
  const item = {
    id: crypto.randomUUID(),
    leadId,
    title: title || "Untitled",
    dueDate: dueDate || null,
    status: "OPEN",
    createdAt: now(),
  };
  s.tasks.unshift(item);
  persist();
  return item;
}

function listTasks(leadId, limit = 50) {
  const s = getState();
  const lim = Math.max(1, Math.min(200, Number(limit) || 50));
  return s.tasks.filter((t) => t.leadId === leadId).slice(0, lim);
}

function addQuote({ leadId, service, guardType, hoursPerWeek, ratePerHour, status } = {}) {
  const s = getState();
  const hrs = Number(hoursPerWeek) || 0;
  const rate = Number(ratePerHour) || 0;

  const item = {
    id: crypto.randomUUID(),
    leadId,
    service: service || "",
    guardType: guardType || "",
    hoursPerWeek: hrs,
    ratePerHour: rate,
    estimatedMonthly: Math.round(((hrs * rate) * 4.33) * 100) / 100,
    status: (status || "DRAFT").toUpperCase(),
    createdAt: now(),
  };
  s.quotes.unshift(item);
  persist();
  return item;
}

function listQuotes(leadId, limit = 50) {
  const s = getState();
  const lim = Math.max(1, Math.min(200, Number(limit) || 50));
  return s.quotes.filter((q) => q.leadId === leadId).slice(0, lim);
}

module.exports = {
  getState,
  persist,
  listLeads,
  getLeadById,
  createLead,
  updateLead,
  addActivity,
  listActivities,
  addTask,
  listTasks,
  addQuote,
  listQuotes,
};
