import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import prisma from "./client.js";

import authRoutes from "./routes/auth.js";
import leadsRoutes from "./routes/leads.js";
import activitiesRoutes from "./routes/activities.js";
import tasksRoutes from "./routes/tasks.js";
import quotesRoutes from "./routes/quotes.js";
import dashboardRoutes from "./routes/dashboard.js";
import emailRoutes from "./routes/email.js";
import aiRoutes from "./routes/ai.js";
import publicRoutes from "./routes/public.js";
import importRoutes from "./routes/import.js";
import settingsRoutes from "./routes/settings.js";

// Load environment variables (Render uses Dashboard env vars; local .env is optional)
dotenv.config({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

const app = express();

// IMPORTANT: Render runs behind a proxy
app.set("trust proxy", 1);

const PORT = Number(process.env.PORT) || 3001;

/**
 * CORS
 * Set CORS_ORIGIN in Render as comma-separated list:
 *   https://elite24-crm.vercel.app,http://localhost:5173
 */
const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN ||
    "https://elite24-crm.vercel.app,http://localhost:5173"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

// Optional: allow Vercel preview deploys for this project
const isAllowedVercelPreview = (origin: string) =>
  /^https:\/\/elite24-crm(-[a-z0-9-]+)?\.vercel\.app$/i.test(origin) ||
  /^https:\/\/elite24-crm-git-[a-z0-9-]+\.vercel\.app$/i.test(origin);

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    // allow curl/postman (no Origin header)
    if (!origin) return cb(null, true);

    const ok = allowedOrigins.has(origin) || isAllowedVercelPreview(origin);

    // ✅ DO NOT throw an Error here (that causes OPTIONS -> 500)
    return cb(null, ok);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight with SAME options

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// DB Health Check
app.get("/api/health/db", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, message: "Database connected" });
  } catch (error) {
    console.error("DB Health Check Failed:", error);
    res.status(500).json({ ok: false, error: "Database connection failed" });
  }
});

// Routes
app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/quotes", quotesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/import", importRoutes);
app.use("/api/settings", settingsRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;

