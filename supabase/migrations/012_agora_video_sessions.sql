-- ============================================================
-- Migration 012: Agora Video Chat Sessions
-- ============================================================

-- video sessions table
CREATE TABLE IF NOT EXISTS public.video_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- link to consultation
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,

    -- agora channel id
    channel_name    TEXT NOT NULL UNIQUE,

    -- caller id
    initiated_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- call status
    status          TEXT NOT NULL DEFAULT 'waiting'
                        CHECK (status IN ('waiting', 'active', 'ended', 'missed')),

    -- participant agora uids
    host_uid        BIGINT,
    guest_uid       BIGINT,

    -- timestamps
    scheduled_at    TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_video_consultation_id ON public.video_sessions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_video_initiated_by    ON public.video_sessions(initiated_by);
CREATE INDEX IF NOT EXISTS idx_video_status          ON public.video_sessions(status);
CREATE INDEX IF NOT EXISTS idx_video_channel_name    ON public.video_sessions(channel_name);

-- ── updated_at trigger ────────────────────────────────────
CREATE TRIGGER trg_video_sessions_updated_at
    BEFORE UPDATE ON public.video_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security ────────────────────────────────────
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

-- patients view own sessions
DROP POLICY IF EXISTS "video_select_patient_own" ON public.video_sessions;
CREATE POLICY "video_select_patient_own"
    ON public.video_sessions FOR SELECT
    TO authenticated
    USING (
        initiated_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM public.consultations c
            WHERE c.id = video_sessions.consultation_id
              AND c.patient_id = auth.uid()
        )
        OR
        public.current_user_role() IN ('doctor', 'admin')
    );

-- authenticated user inserts 
DROP POLICY IF EXISTS "video_insert_authenticated" ON public.video_sessions;
CREATE POLICY "video_insert_authenticated"
    ON public.video_sessions FOR INSERT
    TO authenticated
    WITH CHECK (initiated_by = auth.uid());

-- participant or admin updates 
DROP POLICY IF EXISTS "video_update_participant_or_privileged" ON public.video_sessions;
CREATE POLICY "video_update_participant_or_privileged"
    ON public.video_sessions FOR UPDATE
    TO authenticated
    USING (
        initiated_by = auth.uid()
        OR public.current_user_role() IN ('doctor', 'admin')
    );

-- admin only deletes
DROP POLICY IF EXISTS "video_delete_admin_only" ON public.video_sessions;
CREATE POLICY "video_delete_admin_only"
    ON public.video_sessions FOR DELETE
    TO authenticated
    USING (public.current_user_role() = 'admin');

-- ── Realtime ──────────────────────────────────────────────
-- subscribe frontend to state changes
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
-- auto sync active and end timestamps
CREATE OR REPLACE FUNCTION public.handle_video_session_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
        NEW.started_at = now();
    END IF;

    IF NEW.status IN ('ended', 'missed') AND OLD.status NOT IN ('ended', 'missed') THEN
        NEW.ended_at = now();
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_video_status_timestamps
    BEFORE UPDATE OF status ON public.video_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_video_session_status();
