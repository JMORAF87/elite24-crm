// src/services/activityStore.ts

export type LeadActivityType =
  | "EMAIL_SENT"
  | "TASK_CREATED"
  | "QUOTE_CREATED"
  | "STATUS_CHANGED"
  | "NOTE";

export type LeadActivity = {
  id: string;
  leadId: string;
  type: LeadActivityType;
  title: string;
  createdAt: string; // ISO
  meta?: Record<string, any>;
};

const ACTIVITY_KEY = "elite24:leadActivities:v1";
const STATUS_OVERRIDE_KEY = "elite24:leadStatusOverride:v1";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readActivities(): LeadActivity[] {
  if (typeof window === "undefined") return [];
  return safeJsonParse<LeadActivity[]>(localStorage.getItem(ACTIVITY_KEY), []);
}

function writeActivities(list: LeadActivity[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list));
}

function readStatusOverrides(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return safeJsonParse<Record<string, string>>(
    localStorage.getItem(STATUS_OVERRIDE_KEY),
    {}
  );
}

function writeStatusOverrides(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATUS_OVERRIDE_KEY, JSON.stringify(map));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function addLeadActivity(
  leadId: string,
  input: Omit<LeadActivity, "id" | "leadId" | "createdAt"> & {
    createdAt?: string;
  }
) {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const next: LeadActivity = {
    id: makeId(),
    leadId,
    type: input.type,
    title: input.title,
    createdAt,
    meta: input.meta,
  };

  const list = readActivities();
  list.unshift(next);

  // keep it bounded (demo-friendly)
  const bounded = list.slice(0, 2000);
  writeActivities(bounded);

  return next;
}

export function getActivitiesForLead(leadId: string): LeadActivity[] {
  const list = readActivities().filter((a) => a.leadId === leadId);
  // newest first
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getLastActivityISO(leadId: string): string | null {
  const items = getActivitiesForLead(leadId);
  return items[0]?.createdAt ?? null;
}

export function setLeadStatusOverride(leadId: string, status: string | null) {
  const map = readStatusOverrides();
  if (!status) {
    delete map[leadId];
  } else {
    map[leadId] = status;
  }
  writeStatusOverrides(map);
}

export function getLeadStatusOverride(leadId: string): string | null {
  const map = readStatusOverrides();
  return map[leadId] ?? null;
}
