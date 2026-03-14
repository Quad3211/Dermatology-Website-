-- ============================================================
-- Migration 002: Triggers + Functions
-- ============================================================

-- auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_uploads_updated_at
    BEFORE UPDATE ON public.uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_analysis_updated_at
    BEFORE UPDATE ON public.analysis_results FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_consultations_updated_at
    BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- auto-create consultation on HIGH/CRITICAL risk
CREATE OR REPLACE FUNCTION create_consultation_on_high_risk()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_patient_id UUID;
    v_urgency    urgency_level;
BEGIN
    IF NEW.risk_level IN ('HIGH', 'CRITICAL')
       AND (OLD.risk_level IS DISTINCT FROM NEW.risk_level) THEN

        SELECT u.user_id INTO v_patient_id
        FROM public.uploads u WHERE u.id = NEW.upload_id;

        v_urgency := CASE NEW.risk_level
            WHEN 'CRITICAL' THEN 'CRITICAL'::urgency_level
            ELSE 'HIGH'::urgency_level
        END;

        INSERT INTO public.consultations (patient_id, analysis_id, urgency, status)
        VALUES (v_patient_id, NEW.id, v_urgency, 'pending')
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_consultation
    AFTER UPDATE OF risk_level ON public.analysis_results
    FOR EACH ROW EXECUTE FUNCTION create_consultation_on_high_risk();

-- expire old uploads (call daily via pg_cron or Edge Function)
CREATE OR REPLACE FUNCTION expire_old_uploads()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.uploads
    SET status = 'expired'
    WHERE expires_at < now() AND status NOT IN ('expired', 'failed');

    INSERT INTO public.audit_logs(event, metadata)
    VALUES ('system.uploads.expired', jsonb_build_object('expiredAt', now()));
END;
$$;

-- helper function to update pipeline stage progress
CREATE OR REPLACE FUNCTION update_pipeline_stage(
    p_analysis_id UUID,
    p_stage TEXT,
    p_status TEXT,
    p_progress SMALLINT
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE public.analysis_results
    SET
        progress = p_progress,
        pipeline_stages = pipeline_stages || jsonb_build_object(p_stage, p_status)
    WHERE id = p_analysis_id;
END;
$$;
