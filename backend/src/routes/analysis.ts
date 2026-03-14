import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { auditLog } from "../middleware/auditLogger.js";
import { verifyJWT } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";
import { requireRole } from "../middleware/rbac.js";
import { triggerAIPipeline } from "../services/aiOrchestrator.js";
import { supabase } from "../services/supabase.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const analysisRouter = Router();

// scan limit
const analysisRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Analysis rate limit reached. Please wait 15 minutes.",
    },
  },
});

const MEDICAL_DISCLAIMER =
  "THIS IS A RISK TRIAGE RESULT — NOT A MEDICAL DIAGNOSIS. " +
  "This tool is a decision-support aid only. " +
  "Always consult a qualified, registered dermatologist. " +
  "In an emergency, call 999 (UK) or 911 (US) immediately.";

// trigger scan
analysisRouter.post(
  "/:uploadId",
  verifyJWT,
  requireRole("patient"),
  analysisRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;
      const { uploadId } = req.params;

      // check auth
      const { data: upload, error: uploadErr } = await supabase
        .from("uploads")
        .select("id, user_id, status, storage_path")
        .eq("id", uploadId)
        .single();

      if (uploadErr || !upload)
        throw new HttpError(404, "NOT_FOUND", "Upload not found.");
      if (upload.user_id !== authedReq.userId)
        throw new HttpError(403, "FORBIDDEN", "Access denied.");
      if (upload.status === "expired")
        throw new HttpError(
          410,
          "UPLOAD_EXPIRED",
          "This upload has expired and cannot be analysed.",
        );

      // prevent double processing
      const { data: existing } = await supabase
        .from("analysis_results")
        .select("id, status")
        .eq("upload_id", uploadId)
        .in("status", ["queued", "processing"])
        .maybeSingle();

      if (existing) {
        res.status(202).json({
          analysisId: existing.id,
          uploadId,
          status: existing.status,
          message: "Analysis already in progress.",
        });
        return;
      }

      // write scan entry
      const { data: analysis, error: insertErr } = await supabase
        .from("analysis_results")
        .insert({ upload_id: uploadId, status: "queued", progress: 0 })
        .select()
        .single();

      if (insertErr)
        throw new HttpError(
          500,
          "DB_ERROR",
          "Failed to create analysis record.",
        );

      // flag as processing
      await supabase
        .from("uploads")
        .update({ status: "processing" })
        .eq("id", uploadId);

      // fire background worker
      void triggerAIPipeline({
        analysisId: analysis.id,
        uploadId: String(uploadId),
        storagePath: upload.storage_path,
        userId: authedReq.userId,
      });

      await auditLog("analysis.queued", {
        userId: authedReq.userId,
        resourceType: "analysis",
        resourceId: analysis.id,
        metadata: { uploadId },
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] ?? ""),
      });

      res.status(202).json({
        analysisId: analysis.id,
        uploadId,
        status: "queued",
        estimatedSeconds: 20,
        disclaimer: MEDICAL_DISCLAIMER,
      });
    } catch (err) {
      next(err);
    }
  },
);

// poll scan status
analysisRouter.get(
  "/:analysisId",
  verifyJWT,
  requireRole("patient", "doctor"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;

      const { data: analysis, error } = await supabase
        .from("analysis_results")
        .select("*, uploads!inner(user_id, storage_path)")
        .eq("id", req.params.analysisId)
        .single();

      if (error || !analysis)
        throw new HttpError(404, "NOT_FOUND", "Analysis not found.");

      // verify patient access
      if (
        authedReq.role === "patient" &&
        (analysis.uploads as { user_id: string }).user_id !== authedReq.userId
      ) {
        throw new HttpError(403, "FORBIDDEN", "Access denied.");
      }

      // get image link
      const storagePath = (analysis.uploads as { storage_path: string })
        .storage_path;
      const { data: signedData } = await supabase.storage
        .from("skin-images")
        .createSignedUrl(storagePath, 3600);

      // prune raw db return
      const { uploads: _u, ...result } = analysis as Record<string, unknown>;
      void _u;

      res.json({
        ...result,
        imageUrl: signedData?.signedUrl ?? null,
        disclaimer: MEDICAL_DISCLAIMER,
      });
    } catch (err) {
      next(err);
    }
  },
);

// get scan via upload
analysisRouter.get(
  "/upload/:uploadId",
  verifyJWT,
  requireRole("patient", "doctor"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;

      const { data: upload, error: uploadErr } = await supabase
        .from("uploads")
        .select("user_id, storage_path")
        .eq("id", req.params.uploadId)
        .single();

      if (uploadErr || !upload)
        throw new HttpError(404, "NOT_FOUND", "Upload not found.");
      if (authedReq.role === "patient" && upload.user_id !== authedReq.userId) {
        throw new HttpError(403, "FORBIDDEN", "Access denied.");
      }

      const { data: analysis, error } = await supabase
        .from("analysis_results")
        .select("*")
        .eq("upload_id", req.params.uploadId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !analysis)
        throw new HttpError(
          404,
          "NOT_FOUND",
          "No analysis found for this upload.",
        );

      // attach signed url
      const { data: signedData } = await supabase.storage
        .from("skin-images")
        .createSignedUrl(upload.storage_path, 3600);

      res.json({
        ...analysis,
        imageUrl: signedData?.signedUrl ?? null,
        disclaimer: MEDICAL_DISCLAIMER,
      });
    } catch (err) {
      next(err);
    }
  },
);
