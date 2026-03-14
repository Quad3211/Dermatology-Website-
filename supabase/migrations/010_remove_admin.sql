-- ============================================================
-- Migration 010: Remove Admin Role & Verification
-- ============================================================

-- drop unused verification column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_verified;

-- cleanup old admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all consultations" ON public.consultations;

-- disable audit log api queries
DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_logs;
CREATE POLICY "audit_no_read" ON public.audit_logs FOR SELECT USING (false);
