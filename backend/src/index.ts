import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { uploadsRouter } from "./routes/uploads.js";
import { analysisRouter } from "./routes/analysis.js";
import { consultationsRouter } from "./routes/consultations.js";
import { healthRouter } from "./routes/health.js";
import { publicRouter } from "./routes/public.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestAuditLogger } from "./middleware/auditLogger.js";

const app = express();

// ── Security headers ──────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://*.supabase.co"],
        connectSrc: ["'self'", "https://*.supabase.co"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }),
);

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = (
  process.env.ALLOWED_ORIGIN ?? "http://localhost:5173"
).split(",");
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. server-to-server)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  }),
);

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

// ── Global rate limit ─────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
      },
    },
  }),
);

// ── Audit every request ───────────────────────────────────────
app.use(requestAuditLogger);

// ── Routes ────────────────────────────────────────────────────
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/uploads", uploadsRouter);
app.use("/api/v1/analysis", analysisRouter);
app.use("/api/v1/consultations", consultationsRouter);
app.use("/api/v1/public", publicRouter);

// ── Central error handler ─────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? "3001", 10);
app.listen(PORT, () => {
  console.log(`[DermTriage API] Running on http://localhost:${PORT}`);
});

export default app;
