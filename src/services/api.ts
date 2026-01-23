// src/services/api.ts
import axios, { type AxiosInstance } from "axios";

/**
 * Base URL resolution (priority order):
 * 1) VITE_API_URL (recommended)
 * 2) VITE_API_BASE / VITE_API_BASE_URL (legacy)
 * 3) Local dev fallback -> http://localhost:3001/api
 * 4) Production fallback -> /api  (Vercel rewrite -> Render)
 */
function resolveBaseURL(): string {
  const env = import.meta.env as unknown as Record<string, string | undefined>;

  const fromEnv =
    env.VITE_API_URL || env.VITE_API_BASE || env.VITE_API_BASE_URL;

  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }

  // Local dev default (adjust port if your backend runs elsewhere)
  if (import.meta.env.DEV) return "http://localhost:3001/api";

  // Production: use Vercel rewrite "/api/*" -> "https://elite24-api.onrender.com/api/*"
  return "/api";
}

const api: AxiosInstance = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Bearer token automatically if you store it in localStorage
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore storage errors (private mode / blocked storage / etc.)
  }
  return config;
});

export { api };
export default api;
