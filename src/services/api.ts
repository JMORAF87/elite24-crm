const rawBase =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3000" : "");

export const API_BASE = rawBase.replace(/\/$/, ""); // remove trailing slash
