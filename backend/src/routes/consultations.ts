import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { auditLog } from "../middleware/auditLogger.js";
import { verifyJWT } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";
import { requireRole } from "../middleware/rbac.js";
import { supabase } from "../services/supabase.js";
import type { AuthenticatedRequest } from "../types/index.js";

export const consultationsRouter = Router();

const CreateConsultationSchema = z.object({
  analysisId: z.string().uuid(),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  notes: z.string().max(2000).optional(),
  urgency: z.enum(["ROUTINE", "SOON", "HIGH", "CRITICAL"]).default("ROUTINE"),
});

const UpdateConsultationSchema = z.object({
  status: z.enum(["scheduled", "reviewed", "closed", "cancelled"]).optional(),
  doctorNotes: z.string().max(4000).optional(),
  scheduledAt: z.string().datetime().optional(),
  assignedDoctorId: z.string().uuid().optional(),
});

// create consultation
consultationsRouter.post(
  "/",
  verifyJWT,
  requireRole("patient"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;
      const parsed = CreateConsultationSchema.safeParse(req.body);
      if (!parsed.success)
        throw new HttpError(
          422,
          "VALIDATION_ERROR",
          parsed.error.errors[0].message,
        );

      const { analysisId, preferredDate, notes, urgency } = parsed.data;

      // ensure patient owns scan
      const { data: analysis, error: analysisErr } = await supabase
        .from("analysis_results")
        .select("id, upload_id, uploads!inner(user_id)")
        .eq("id", analysisId)
        .single();

      if (analysisErr || !analysis)
        throw new HttpError(404, "NOT_FOUND", "Analysis not found.");
      if (
        (analysis.uploads as unknown as { user_id: string }).user_id !==
        authedReq.userId
      ) {
        throw new HttpError(403, "FORBIDDEN", "Access denied.");
      }

      const { data: consultation, error } = await supabase
        .from("consultations")
        .insert({
          patient_id: authedReq.userId,
          analysis_id: analysisId,
          urgency,
          patient_notes: notes ?? null,
          preferred_date: preferredDate ?? null,
          status: "pending",
        })
        .select()
        .single();

      if (error)
        throw new HttpError(500, "DB_ERROR", "Failed to create consultation.");

      await auditLog("consultation.created", {
        userId: authedReq.userId,
        resourceType: "consultation",
        resourceId: consultation.id,
        metadata: { analysisId, urgency },
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] ?? ""),
      });

      res.status(201).json(consultation);
    } catch (err) {
      next(err);
    }
  },
);

// fetch consultations
consultationsRouter.get(
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
        .from("consultations")
        .select(
          `id, status, urgency, scheduled_at, created_at, patient_notes,
           analysis_id,
           patient:profiles!consultations_patient_id_fkey(id, full_name, email:id),
           analysis:analysis_results(risk_level, confidence)`,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (authedReq.role === "patient")
        query = query.eq("patient_id", authedReq.userId);
      // filter doctor assignments
      if (authedReq.role === "doctor")
        query = query.or(`doctor_id.eq.${authedReq.userId},doctor_id.is.null`);
      if (status) query = query.eq("status", status);

      const { data, count, error } = await query;
      if (error)
        throw new HttpError(500, "DB_ERROR", "Failed to fetch consultations.");

      res.json({
        data: data ?? [],
        pagination: { page, limit, total: count ?? 0 },
      });
    } catch (err) {
      next(err);
    }
  },
);

// fetch single consult
consultationsRouter.get(
  "/:id",
  verifyJWT,
  requireRole("patient", "doctor"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;

      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (error || !data)
        throw new HttpError(404, "NOT_FOUND", "Consultation not found.");

      if (
        authedReq.role === "patient" &&
        data.patient_id !== authedReq.userId
      ) {
        throw new HttpError(403, "FORBIDDEN", "Access denied.");
      }
      if (authedReq.role === "doctor" && data.doctor_id !== authedReq.userId) {
        throw new HttpError(403, "FORBIDDEN", "Access denied.");
      }

      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

// doctor status updates
consultationsRouter.patch(
  "/:id",
  verifyJWT,
  requireRole("doctor"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authedReq = req as AuthenticatedRequest;
      const parsed = UpdateConsultationSchema.safeParse(req.body);
      if (!parsed.success)
        throw new HttpError(
          422,
          "VALIDATION_ERROR",
          parsed.error.errors[0].message,
        );

      const { status, doctorNotes, scheduledAt, assignedDoctorId } =
        parsed.data;

      const updatePayload: Record<string, unknown> = {};
      if (status) updatePayload.status = status;
      if (doctorNotes) updatePayload.doctor_notes = doctorNotes;
      if (scheduledAt) updatePayload.scheduled_at = scheduledAt;
      if (assignedDoctorId) updatePayload.doctor_id = assignedDoctorId;
      if (status === "reviewed")
        updatePayload.reviewed_at = new Date().toISOString();
      if (status === "closed")
        updatePayload.closed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("consultations")
        .update(updatePayload)
        .eq("id", req.params.id)
        .select()
        .single();

      if (error)
        throw new HttpError(500, "DB_ERROR", "Failed to update consultation.");

      await auditLog("consultation.updated", {
        userId: authedReq.userId,
        resourceType: "consultation",
        resourceId: String(req.params.id),
        metadata: { status, assignedDoctorId },
        ipAddress: req.ip,
        userAgent: String(req.headers["user-agent"] ?? ""),
      });

      res.json({
        id: data.id,
        status: data.status,
        updatedAt: data.updated_at,
      });
    } catch (err) {
      next(err);
    }
  },
);
