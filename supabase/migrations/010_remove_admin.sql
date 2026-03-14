-- ============================================================
-- Migration 010: Remove Admin Role & Verification
-- ============================================================

-- 1. Remove is_verified column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_verified;

-- 2. Drop "Admins can view..." policies created in 006
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all consultations" ON public.consultations;

-- 3. Update audit_logs admin policies to restrict everyone or remove completely
-- Previously audit_logs were read-only by admins. Now, nobody can query them via API.
-- (Alternatively, we can leave them for server-side only access)
DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_logs;
CREATE POLICY "audit_no_read" ON public.audit_logs FOR SELECT USING (false);

-- Note: We are leaving the 'admin' value in the user_role ENUM type.
-- PostgreSQL does not support dropping a single ENUM value easily without 
-- costly workarounds (creating a new type, casting, dropping the old). 
-- Since we never insert it anymore via the UI or backend, leaving it in the enum list is safe.
