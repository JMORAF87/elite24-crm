// api/_store.js
const STATUS_ORDER = ["NEW", "ATTEMPTED", "CONNECTED", "MEETING_SET", "WON"];

function initStore() {
  return {
    // Lead runtime state overlay (because your base leads list is likely static)
    leadMeta: Object.create(null), // leadId -> { status, attempts, lastAttemptAt }

    // Per-lead data
    activities: [], // { id, leadId, type, createdAt, meta }
    tasks: [],      // { id, leadId, title, dueDate, completed, createdAt }
    quotes: [],     // { id, leadId, service, guardType, hrsPerWeek, rate, monthly, status, createdAt }
  };
}

const store = globalThis.__ELITE24_STORE__ || (globalThis.__ELITE24_STORE__ = initStore());

function uid(prefix = "id") {
  // Works in modern runtimes; safe fallback if not
  const rnd =
    (globalThis.crypto && globalThis.crypto.randomUUID && globalThis.crypto.randomUUID()) ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${rnd}`;
}

export function addActivity({ leadId, type, createdAt, meta }) {
  if (!leadId || !type) return null;
  const item = {
    id: uid("act"),
    leadId,
    type,
    createdAt: createdAt || new Date().toISOString(),
    meta: meta || {},
  };
  store.activities.unshift(item);
  return item;
}

export function listActivities(leadId) {
  return leadId
    ? store.activities.filter((a) => a.leadId === leadId)
    : store.activities;
}

export function bumpLeadStatus(leadId, nextStatus, atIso) {
  if (!leadId) return null;

  const meta = store.leadMeta[leadId] || { status: "NEW", attempts: 0, lastAttemptAt: null };
  const currentIdx = STATUS_ORDER.indexOf(meta.status || "NEW");
  const nextIdx = STATUS_ORDER.indexOf(nextStatus);

  const finalStatus =
    nextIdx === -1 ? meta.status : STATUS_ORDER[Math.max(currentIdx, nextIdx)];

  // attempts tracking if moving to ATTEMPTED (or on repeated attempts)
  const now = atIso || new Date().toISOString();
  const isAttempt = nextStatus === "ATTEMPTED";

  store.leadMeta[leadId] = {
    ...meta,
    status: finalStatus,
    attempts: isAttempt ? (meta.attempts || 0) + 1 : (meta.attempts || 0),
    lastAttemptAt: isAttempt ? now : meta.lastAttemptAt,
  };

  return store.leadMeta[leadId];
}

export default store;
