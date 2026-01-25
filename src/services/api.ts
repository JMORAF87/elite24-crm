// src/services/api.ts
import axios, { AxiosError, AxiosRequestConfig } from "axios";

/**
 * Base URL strategy:
 * - Production (Vercel): use "/api" and let vercel.json proxy to Render.
 * - Local dev: default to "http://localhost:3001/api"
 *
 * Override with VITE_API_URL:
 * - VITE_API_URL="/api"
 * - VITE_API_URL="https://elite24-api.onrender.com/api"
 */
const rawEnvUrl = (import.meta.env.VITE_API_URL || "").trim();
const isDev = import.meta.env.DEV;

export const API_BASE_URL =
  rawEnvUrl || (isDev ? "http://localhost:3001/api" : "/api");

function isFormData(val: unknown): val is FormData {
  return typeof FormData !== "undefined" && val instanceof FormData;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: { Accept: "application/json" }, // ✅ do not force Content-Type globally
});

// Attach token automatically (if you store it)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  // If payload is FormData, allow axios to set correct multipart boundary.
  if (isFormData(config.data)) {
    config.headers = config.headers ?? {};
    delete (config.headers as any)["Content-Type"];
  } else {
    // Default JSON only when we're sending plain objects
    config.headers = config.headers ?? {};
    if (!(config.headers as any)["Content-Type"]) {
      (config.headers as any)["Content-Type"] = "application/json";
    }
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

    // Preserve original details for debugging
    const err = new Error(message) as Error & { status?: number; data?: any };
    err.status = status;
    err.data = data;

    return Promise.reject(err);
  }
);

export default api;
