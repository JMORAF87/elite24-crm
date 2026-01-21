const normalizeBase = (url: string) => url.replace(/\/$/, '');

export const API_BASE = import.meta.env.DEV
  ? "http://localhost:3000"
  : "/api";
