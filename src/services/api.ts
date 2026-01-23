import axios, { AxiosError } from "axios";

/**
 * Base URL strategy:
 * - Production (Vercel): use "/api" and let vercel.json proxy to Render.
 * - Local dev: default to "http://localhost:3001/api"
 *
 * You can override with VITE_API_URL:
 * - VITE_API_URL="/api"
 * - VITE_API_URL="https://elite24-api.onrender.com/api" (direct)
 */
const rawEnvUrl = (import.meta.env.VITE_API_URL || "").trim();
const isDev = import.meta.env.DEV;

export const API_BASE_URL =
  rawEnvUrl || (isDev ? "http://localhost:3001/api" : "/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// Attach token automatically (if you store it)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors into a useful message
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const data = error.response?.data as any;

    const message =
      data?.message ||
      data?.error ||
      (status ? `Request failed (${status})` : error.message);

    return Promise.reject(new Error(message));
  }
);

export default api;

