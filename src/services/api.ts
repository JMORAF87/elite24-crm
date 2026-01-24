// src/services/api.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

function getBaseURL(): string {
  // In Vercel set VITE_API_URL to:
  // - "/api" (using vercel.json rewrites), OR
  // - "https://<your-backend>/api" (direct)
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim().length > 0) return envUrl.trim();

  // Local fallback
  const isDev = (import.meta as any).env?.DEV;
  return isDev ? "http://localhost:3001/api" : "/api";
}

export type ApiErrorMeta = {
  status?: number;
  code?: string;
  details?: unknown;
  url?: string;
  method?: string;
  isNetworkError?: boolean;
  isTimeout?: boolean;
};

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  url?: string;
  method?: string;
  isNetworkError?: boolean;
  isTimeout?: boolean;

  constructor(message: string, meta: ApiErrorMeta = {}) {
    super(message);
    this.name = "ApiError";
    Object.assign(this, meta);
  }
}

function normalizeAxiosError(err: unknown): ApiError {
  if (!axios.isAxiosError(err)) {
    return new ApiError("Unexpected error", { details: err });
  }

  const ax = err as AxiosError<any>;
  const status = ax.response?.status;
  const url = ax.config?.url;
  const method = ax.config?.method?.toUpperCase();

  const isTimeout =
    ax.code === "ECONNABORTED" ||
    (typeof ax.message === "string" && ax.message.toLowerCase().includes("timeout"));

  const isNetworkError = !ax.response && !!ax.request;

  const serverMessage =
    ax.response?.data?.message ||
    ax.response?.data?.error ||
    ax.response?.data?.detail ||
    ax.response?.data?.msg;

  const message =
    serverMessage ||
    (status ? `Request failed (${status})` : isNetworkError ? "Network error" : "Request failed");

  return new ApiError(message, {
    status,
    code: ax.code,
    details: ax.response?.data ?? ax.message,
    url,
    method,
    isNetworkError,
    isTimeout,
  });
}

export const api: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token if present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore (SSR / private mode)
  }
  return config;
});

// Normalize errors on response
api.interceptors.response.use(
  (res) => res,
  (err) => {
    throw normalizeAxiosError(err);
  }
);

// Convenience wrappers (optional)
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<T>(url, config);
  return res.data;
}
export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.post<T>(url, body, config);
  return res.data;
}
export async function apiPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.put<T>(url, body, config);
  return res.data;
}
export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete<T>(url, config);
  return res.data;
}

// Healthcheck helper (expects backend route: GET /api/health)
export async function healthCheck(): Promise<{ ok: boolean; status?: number; message?: string }> {
  try {
    const res = await api.get("/health", { timeout: 6000 });
    return { ok: true, status: res.status };
  } catch (e) {
    const err = e instanceof ApiError ? e : normalizeAxiosError(e);
    return { ok: false, status: err.status, message: err.message };
  }
}

