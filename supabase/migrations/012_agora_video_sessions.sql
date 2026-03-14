-- ============================================================
-- Migration 012: Agora Video Chat Sessions
-- ============================================================
-- Agora handles all audio/video via its SDK (RTC).
-- This table tracks channel metadata and session state so the
-- app can coordinate who is in a call, generate tokens server-side,
-- and display call history.
-- ============================================================

-- ── video_sessions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.video_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Linked consultation (nullable: allow ad-hoc doctor→patient calls)
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,

    -- Agora channel name — unique per call, generated server-side
    -- Format recommendation: "consult-{consultation_id}" or a UUID
    channel_name    TEXT NOT NULL UNIQUE,

    -- Who initiated the call
    initiated_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Call state machine
    -- waiting  : host joined, waiting for the other party
    -- active   : both parties connected
    -- ended    : call finished normally
    -- missed   : nobody joined within the timeout window
    status          TEXT NOT NULL DEFAULT 'waiting'
                        CHECK (status IN ('waiting', 'active', 'ended', 'missed')),

    -- Agora UID assigned to each participant (stored so we can revoke tokens)
    host_uid        BIGINT,   -- doctor / initiator Agora UID
    guest_uid       BIGINT,   -- patient / joiner  Agora UID

    -- Timestamps
    scheduled_at    TIMESTAMPTZ,              -- optional: pre-scheduled call time
    started_at      TIMESTAMPTZ,              -- when status → 'active'
    ended_at        TIMESTAMPTZ,              -- when status → 'ended' or 'missed'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_consultation_id ON public.video_sessions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_video_initiated_by    ON public.video_sessions(initiated_by);
CREATE INDEX IF NOT EXISTS idx_video_status          ON public.video_sessions(status);
CREATE INDEX IF NOT EXISTS idx_video_channel_name    ON public.video_sessions(channel_name);

-- ── updated_at trigger ────────────────────────────────────
-- Reuses the update_updated_at() function created in migration 002
CREATE TRIGGER trg_video_sessions_updated_at
    BEFORE UPDATE ON public.video_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security ────────────────────────────────────
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

-- Patients can see video sessions linked to their own consultations
DROP POLICY IF EXISTS "video_select_patient_own" ON public.video_sessions;
CREATE POLICY "video_select_patient_own"
    ON public.video_sessions FOR SELECT
    TO authenticated
    USING (
        -- patient is the initiator
        initiated_by = auth.uid()
        OR
        -- patient's consultation is linked
        EXISTS (
            SELECT 1 FROM public.consultations c
            WHERE c.id = video_sessions.consultation_id
              AND c.patient_id = auth.uid()
        )
        OR
        -- doctors / admins can see all sessions
        public.current_user_role() IN ('doctor', 'admin')
    );

-- Anyone authenticated can INSERT (the server-side Edge Function creates sessions
-- on behalf of users, but patients/doctors may also initiate directly)
DROP POLICY IF EXISTS "video_insert_authenticated" ON public.video_sessions;
CREATE POLICY "video_insert_authenticated"
    ON public.video_sessions FOR INSERT
    TO authenticated
    WITH CHECK (initiated_by = auth.uid());

-- Only the initiator, a doctor, or an admin can update session state
DROP POLICY IF EXISTS "video_update_participant_or_privileged" ON public.video_sessions;
CREATE POLICY "video_update_participant_or_privileged"
    ON public.video_sessions FOR UPDATE
    TO authenticated
    USING (
        initiated_by = auth.uid()
        OR public.current_user_role() IN ('doctor', 'admin')
    );

-- Only admins can hard-delete session records
DROP POLICY IF EXISTS "video_delete_admin_only" ON public.video_sessions;
CREATE POLICY "video_delete_admin_only"
    ON public.video_sessions FOR DELETE
    TO authenticated
    USING (public.current_user_role() = 'admin');

-- ── Realtime ──────────────────────────────────────────────
-- Lets the frontend react instantly when a call is initiated or status changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname   = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'video_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.video_sessions;
  END IF;
END;
$$;

-- ── Helper: auto-set started_at / ended_at on status change ──
CREATE OR REPLACE FUNCTION public.handle_video_session_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Mark when the call went live
    IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
        NEW.started_at = now();
    END IF;

    -- Mark when the call finished
    IF NEW.status IN ('ended', 'missed') AND OLD.status NOT IN ('ended', 'missed') THEN
        NEW.ended_at = now();
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_video_status_timestamps
    BEFORE UPDATE OF status ON public.video_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_video_session_status();
