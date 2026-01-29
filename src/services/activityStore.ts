// src/services/activityStore.ts
export type ActivityType = "EMAIL" | "CALL" | "NOTE" | "TASK";

export type Activity = {
  id: string;
  leadId: string;
  type: ActivityType;
  title: string;
  detail?: string;
  createdAt: string; // ISO
  meta?: Record<string, any>;
};

const STORAGE_KEY = "elite24.activities.v1";

function readAll(): Activity[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeAll(items: Activity[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getActivitiesForLead(leadId: string): Activity[] {
  return readAll()
    .filter((a) => a.leadId === leadId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addActivity(activity: Activity) {
  const items = readAll();
  items.push(activity);
  writeAll(items);
}

export function getLastActivityISO(leadId: string): string | null {
  const latest = getActivitiesForLead(leadId)[0];
  return latest ? latest.createdAt : null;
}