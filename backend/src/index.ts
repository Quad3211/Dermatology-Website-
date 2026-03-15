import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { requestAuditLogger } from "./middleware/auditLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { analysisRouter } from "./routes/analysis.js";
import { consultationsRouter } from "./routes/consultations.js";
import { healthRouter } from "./routes/health.js";
import { publicRouter } from "./routes/public.js";
import { uploadsRouter } from "./routes/uploads.js";

const app = express();

// setup security headers
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

// setup cors
const allowedOrigins = (
  process.env.ALLOWED_ORIGIN ?? "http://localhost:5173"
).split(",").map(o => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // allow serverless / same-origin requests with no origin header
      if (!origin) return cb(null, true);
      // exact match or vercel preview URLs (*.vercel.app)
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/[a-zA-Z0-9-]+-[a-zA-Z0-9]+\.vercel\.app$/.test(origin) ||
        allowedOrigins.some(o => origin.startsWith(o));
      if (isAllowed) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  }),
);

// body parser limit
app.use(express.json({ limit: "10mb" }));

// global rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15m limit
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

// audit all requests
app.use(requestAuditLogger);

// mount routes
app.use("/api/v1/health", healthRouter);
app.use("/api/v1/uploads", uploadsRouter);
app.use("/api/v1/analysis", analysisRouter);
app.use("/api/v1/consultations", consultationsRouter);
app.use("/api/v1/public", publicRouter);

// global error catch
app.use(errorHandler);

// start http server only if not in Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = parseInt(process.env.PORT ?? "3001", 10);
  app.listen(PORT, () => {
    console.log(`[DermTriage API] Running on http://localhost:${PORT}`);
  });
}

export default app;
