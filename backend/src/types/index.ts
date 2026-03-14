// ── Domain types shared across backend ────────────────────────

export type UserRole = "patient" | "doctor";
export type UploadStatus =
  | "pending"
  | "uploaded"
  | "processing"
  | "complete"
  | "failed"
  | "expired";
export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ConsultationStatus =
  | "pending"
  | "scheduled"
  | "reviewed"
  | "closed"
  | "cancelled";
export type UrgencyLevel = "ROUTINE" | "SOON" | "HIGH" | "CRITICAL";

// ── Augmented Express Request ──────────────────────────────────
import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  userId: string;
  role: UserRole;
  userEmail: string;
}

// ── Supabase row types ─────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  skin_tone: string | null;
  country: string | null;
  postcode: string | null;
  license_number: string | null;
  specialty: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Upload {
  id: string;
  user_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  body_part: string | null;
  status: UploadStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  id: string;
  upload_id: string;
  status: string;
  progress: number;
  risk_level: RiskLevel | null;
  confidence: number | null;
  severity_score: number | null;
  summary: string | null;
  disclaimer: string;
  referral_required: boolean;
  emergency_flag: boolean;
  doctor_review_done: boolean;
  xai_metadata: Record<string, unknown> | null;
  pipeline_stages: Record<string, string>;
  error_message: string | null;
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  analysis_id: string;
  status: ConsultationStatus;
  urgency: UrgencyLevel;
  patient_notes: string | null;
  preferred_date: string | null;
  doctor_notes: string | null;
  scheduled_at: string | null;
  reviewed_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  event: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

// ── API Response helpers ───────────────────────────────────────

export interface ApiError {
  error: {
    code: string;
    message: string;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
