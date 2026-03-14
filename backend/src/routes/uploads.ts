import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { verifyJWT } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { auditLog } from "../middleware/auditLogger.js";
import { supabase } from "../services/supabase.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { AuthenticatedRequest } from "../types/index.js";
import type { Request, Response, NextFunction } from "express";

export const uploadsRouter = Router();

// Stricter rate limit for uploads (20/hour per IP)
const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Upload limit reached. Please wait before uploading again.",
    },
  },
});

// ── Validation schema ─────────────────────────────────────────
const CreateUploadSchema = z.object({
  filename: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[\w\-. ]+$/, "Invalid filename"),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024, "File must be ≤ 10 MB"),
  bodyPart: z.string().max(100).optional(),
});

const STORAGE_BUCKET = "skin-images";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

// ── POST /uploads ─────────────────────────────────────────────
uploadsRouter.post(
  "/",
  verifyJWT,
  requireRole("patient"),
  uploadRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;
      const parsed = CreateUploadSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(
          422,
          "VALIDATION_ERROR",
          parsed.error.errors[0].message,
        );
      }

      const { filename, mimeType, sizeBytes, bodyPart } = parsed.data;
      const ext = filename.split(".").pop() ?? "jpg";
      const storagePath = `${authedReq.userId}/${crypto.randomUUID()}.${ext}`;

      // Insert DB row (status=pending) first
      const { data: upload, error: dbError } = await supabase
        .from("uploads")
        .insert({
          user_id: authedReq.userId,
          filename,
          mime_type: mimeType,
          size_bytes: sizeBytes,
          storage_path: storagePath,
          body_part: bodyPart ?? null,
          status: "pending",
        })
        .select()
        .single();

      if (dbError)
        throw new HttpError(500, "DB_ERROR", "Failed to create upload record.");

      // Generate signed upload URL
      const { data: signedData, error: signError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUploadUrl(storagePath);

      if (signError)
        throw new HttpError(
          500,
          "STORAGE_ERROR",
          "Failed to generate upload URL.",
        );

      await auditLog("upload.created", {
        userId: authedReq.userId,
        resourceType: "upload",
        resourceId: upload.id,
        metadata: { filename, mimeType, sizeBytes },
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] ?? ""),
      });

      res.status(201).json({
        uploadId: upload.id,
        signedUrl: signedData.signedUrl,
        token: signedData.token,
        expiresAt: new Date(
          Date.now() + SIGNED_URL_EXPIRY * 1000,
        ).toISOString(),
        disclaimer:
          "This platform performs risk triage only and does not provide medical diagnosis. Always consult a qualified dermatologist.",
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /uploads (list own uploads) ──────────────────────────
uploadsRouter.get(
  "/",
  verifyJWT,
  requireRole("patient", "doctor"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;
      const page = parseInt(String(req.query.page ?? "1"), 10);
      const limit = Math.min(
        parseInt(String(req.query.limit ?? "20"), 10),
        100,
      );
      const status = req.query.status as string | undefined;
      const offset = (page - 1) * limit;

      let query = supabase
        .from("uploads")
        .select("id, filename, status, created_at, body_part", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      // Patients only see own uploads; doctors/admins need separate filtering
      if (authedReq.role === "patient") {
        query = query.eq("user_id", authedReq.userId);
      }
      if (status) query = query.eq("status", status);

      const { data, count, error } = await query;
      if (error)
        throw new HttpError(500, "DB_ERROR", "Failed to fetch uploads.");

      res.json({
        data: data ?? [],
        pagination: { page, limit, total: count ?? 0 },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ── GET /uploads/:id ──────────────────────────────────────────
uploadsRouter.get(
  "/:id",
  verifyJWT,
  requireRole("patient", "doctor"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;

      const { data: upload, error } = await supabase
        .from("uploads")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (error || !upload)
        throw new HttpError(404, "NOT_FOUND", "Upload not found.");

      // Patients can only see their own
      if (authedReq.role === "patient" && upload.user_id !== authedReq.userId) {
        throw new HttpError(403, "FORBIDDEN", "Access denied.");
      }

      // Generate a fresh signed read URL
      const { data: signedData } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(upload.storage_path, SIGNED_URL_EXPIRY);

      res.json({ ...upload, imageUrl: signedData?.signedUrl ?? null });
    } catch (err) {
      next(err);
    }
  },
);

// ── PATCH /uploads/:id/status (internal — mark as uploaded) ───
uploadsRouter.patch(
  "/:id/status",
  verifyJWT,
  requireRole("patient"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;
      const { status } = z
        .object({ status: z.enum(["uploaded", "failed"]) })
        .parse(req.body);

      const { data: upload, error: fetchErr } = await supabase
        .from("uploads")
        .select("user_id")
        .eq("id", req.params.id)
        .single();

      if (fetchErr || !upload)
        throw new HttpError(404, "NOT_FOUND", "Upload not found.");
      if (authedReq.role === "patient" && upload.user_id !== authedReq.userId) {
        throw new HttpError(403, "FORBIDDEN", "Access denied.");
      }

      const { error } = await supabase
        .from("uploads")
        .update({ status })
        .eq("id", req.params.id);

      if (error)
        throw new HttpError(500, "DB_ERROR", "Failed to update upload status.");

      res.json({
        id: req.params.id,
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
);
