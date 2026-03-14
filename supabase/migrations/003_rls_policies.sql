-- ============================================================
-- Migration 003: Row Level Security Policies
-- ============================================================

-- enable RLS
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;

-- get user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ── profiles ──────────────────────────────────────────────────
-- read profile
CREATE POLICY "profiles_select_own_or_doctor"
    ON public.profiles FOR SELECT
    USING (id = auth.uid() OR public.current_user_role() IN ('doctor', 'admin'));

-- create profile
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- edit profile
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

-- ── uploads ───────────────────────────────────────────────────
-- upload images
CREATE POLICY "uploads_insert_patient"
    ON public.uploads FOR INSERT
    WITH CHECK (user_id = auth.uid() AND public.current_user_role() = 'patient');

-- read images
CREATE POLICY "uploads_select_own_or_privileged"
    ON public.uploads FOR SELECT
    USING (user_id = auth.uid() OR public.current_user_role() IN ('doctor', 'admin'));

-- edit uploads
CREATE POLICY "uploads_update_own"
    ON public.uploads FOR UPDATE
    USING (user_id = auth.uid() OR public.current_user_role() = 'admin');

-- delete uploads (admins only)
CREATE POLICY "uploads_no_patient_delete"
    ON public.uploads FOR DELETE
    USING (public.current_user_role() = 'admin');

-- ── analysis_results ──────────────────────────────────────────
-- read AI results
CREATE POLICY "analysis_select_patient_own"
    ON public.analysis_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.uploads u
            WHERE u.id = upload_id
              AND (u.user_id = auth.uid() OR public.current_user_role() IN ('doctor', 'admin'))
        )
    );

-- ── consultations ─────────────────────────────────────────────
-- read consultations
CREATE POLICY "consult_select_participant"
    ON public.consultations FOR SELECT
    USING (
        patient_id = auth.uid()
        OR public.current_user_role() IN ('doctor', 'admin')
    );

-- book consultation
CREATE POLICY "consult_insert_patient"
    ON public.consultations FOR INSERT
    WITH CHECK (patient_id = auth.uid() AND public.current_user_role() = 'patient');

-- update consultation (staff only)
CREATE POLICY "consult_update_doctor_admin"
    ON public.consultations FOR UPDATE
    USING (public.current_user_role() IN ('doctor', 'admin'));

-- ── audit_logs ────────────────────────────────────────────────
-- read logs (admins only)
CREATE POLICY "audit_admin_read"
    ON public.audit_logs FOR SELECT
    USING (public.current_user_role() = 'admin');

-- no updates allowed
CREATE POLICY "audit_no_update"
    ON public.audit_logs FOR UPDATE
    USING (false);

-- no deletes allowed
CREATE POLICY "audit_no_delete"
    ON public.audit_logs FOR DELETE
    USING (false);
