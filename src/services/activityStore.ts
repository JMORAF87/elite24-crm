// src/services/activityStore.ts
type ActivityType = "EMAIL_SENT" | "TASK_CREATED" | "QUOTE_CREATED" | "STATUS_CHANGED";

export type ActivityEvent = {
  id: string;
  leadId: string;
  type: ActivityType;
  summary: string;
  createdAt: string; // ISO
  meta?: Record<string, any>;
};

const KEY = "elite24.activities.v1";

function safeRead(): ActivityEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActivityEvent[]) : [];
  } catch {
    return [];
  }
}

function safeWrite(events: ActivityEvent[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(events));
  } catch {
    // ignore
  }
}

export function recordActivity(input: Omit<ActivityEvent, "id" | "createdAt">) {
  const events = safeRead();
  const evt: ActivityEvent = {
    ...input,
    id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
  };
  events.unshift(evt);
  safeWrite(events);

  // Let any page re-render / refresh
  window.dispatchEvent(new CustomEvent("elite24:activity", { detail: { leadId: input.leadId } }));
}

export function listActivities(leadId: string): ActivityEvent[] {
  return safeRead().filter(e => e.leadId === leadId);
}

export function getLastActivityISO(leadId: string): string | null {
  const events = safeRead().filter(e => e.leadId === leadId);
  return events.length ? events[0].createdAt : null;
}
