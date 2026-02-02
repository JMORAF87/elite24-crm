// api/_store.js
import crypto from "node:crypto";

const KEY = "__ELITE24_STORE__";

const store =
  globalThis[KEY] ||
  (globalThis[KEY] = {
    tasks: [],
    quotes: [],
    activities: [],
    leadMeta: {}, // optional: { [leadId]: { attempts:number, lastAttemptAt:string } }
  });

export default store;

export function isoNow() {
  return new Date().toISOString();
}

export function uid(prefix = "") {
  const id = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
  return `${prefix}${id}`;
}

export function toDateOnly(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
