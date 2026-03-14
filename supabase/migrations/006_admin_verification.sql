-- ============================================================
-- Migration 006: Admin and Doctor Verification
-- ============================================================

-- add is_verified column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- admins view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- admins verify profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- admins view all consultations
DROP POLICY IF EXISTS "Admins can view all consultations" ON public.consultations;
CREATE POLICY "Admins can view all consultations" ON public.consultations
    FOR SELECT USING (
        auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
