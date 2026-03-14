-- ============================================================
-- Migration 001: Initial Schema
-- AI Dermatology Triage Platform
-- Run via: npx supabase db push
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
CREATE TYPE upload_status AS ENUM ('pending', 'uploaded', 'processing', 'complete', 'failed', 'expired');
CREATE TYPE risk_level AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');
CREATE TYPE consultation_status AS ENUM ('pending', 'scheduled', 'reviewed', 'closed', 'cancelled');
CREATE TYPE urgency_level AS ENUM ('ROUTINE', 'SOON', 'HIGH', 'CRITICAL');

-- ── profiles ──────────────────────────────────────────────────
CREATE TABLE public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL,
    role            user_role NOT NULL DEFAULT 'patient',
    date_of_birth   DATE,
    gender          TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')),
    phone           TEXT,
    skin_tone       TEXT,
    country         TEXT,
    postcode        TEXT,
    license_number  TEXT,
    specialty       TEXT,
    avatar_url      TEXT,
    onboarded_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── uploads ───────────────────────────────────────────────────
CREATE TABLE public.uploads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    filename        TEXT NOT NULL,
    mime_type       TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    size_bytes      BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
    storage_path    TEXT NOT NULL,
    body_part       TEXT,
    status          upload_status NOT NULL DEFAULT 'pending',
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days'),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_uploads_user_id ON public.uploads(user_id);
CREATE INDEX idx_uploads_status  ON public.uploads(status);
CREATE INDEX idx_uploads_expires ON public.uploads(expires_at);

-- ── analysis_results ──────────────────────────────────────────
CREATE TABLE public.analysis_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    upload_id           UUID NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'queued'
                            CHECK (status IN ('queued', 'processing', 'complete', 'failed')),
    progress            SMALLINT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    risk_level          risk_level,
    confidence          NUMERIC(4,3) CHECK (confidence BETWEEN 0 AND 1),
    severity_score      NUMERIC(4,1) CHECK (severity_score BETWEEN 0 AND 10),
    summary             TEXT,
    disclaimer          TEXT NOT NULL DEFAULT
        'THIS IS A RISK TRIAGE RESULT — NOT A MEDICAL DIAGNOSIS. Always consult a qualified dermatologist.',
    referral_required   BOOLEAN NOT NULL DEFAULT false,
    emergency_flag      BOOLEAN NOT NULL DEFAULT false,
    doctor_review_done  BOOLEAN NOT NULL DEFAULT false,
    xai_metadata        JSONB,
    pipeline_stages     JSONB DEFAULT '{}',
    error_message       TEXT,
    queued_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analysis_upload_id  ON public.analysis_results(upload_id);
CREATE INDEX idx_analysis_risk       ON public.analysis_results(risk_level);
CREATE INDEX idx_analysis_emergency  ON public.analysis_results(emergency_flag) WHERE emergency_flag = true;
CREATE INDEX idx_analysis_status     ON public.analysis_results(status);

-- ── consultations ─────────────────────────────────────────────
CREATE TABLE public.consultations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES public.profiles(id),
    doctor_id       UUID REFERENCES public.profiles(id),
    analysis_id     UUID NOT NULL REFERENCES public.analysis_results(id),
    status          consultation_status NOT NULL DEFAULT 'pending',
    urgency         urgency_level NOT NULL DEFAULT 'ROUTINE',
    patient_notes   TEXT,
    preferred_date  DATE,
    doctor_notes    TEXT,
    scheduled_at    TIMESTAMPTZ,
    reviewed_at     TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consult_patient ON public.consultations(patient_id);
CREATE INDEX idx_consult_doctor  ON public.consultations(doctor_id);
CREATE INDEX idx_consult_status  ON public.consultations(status);
CREATE INDEX idx_consult_urgency ON public.consultations(urgency);

-- ── audit_logs ────────────────────────────────────────────────
CREATE TABLE public.audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event           TEXT NOT NULL,
    resource_type   TEXT,
    resource_id     UUID,
    metadata        JSONB DEFAULT '{}',
    ip_address      INET,
    user_agent      TEXT,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_user      ON public.audit_logs(user_id);
CREATE INDEX idx_audit_event     ON public.audit_logs(event);
CREATE INDEX idx_audit_timestamp ON public.audit_logs(timestamp DESC);
