import axios from "axios";

// ✅ In Vercel set VITE_API_URL to either:
//   - "/api" (and use vercel.json rewrites), OR
//   - "https://elite24-api.onrender.com/api" (direct to Render)
//
// This default makes local dev easy too.
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3001/api" : "/api");

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: attach token automatically if you store it
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
