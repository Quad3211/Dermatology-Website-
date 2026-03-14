-- ============================================================
-- Migration 006: Admin and Doctor Verification
-- ============================================================

-- 1. Add is_verified column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Since the user_role enum already has 'admin', we just need to ensure policies allow admins to do things.

-- 2. Update RLS policies for Admins
-- Allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- Allow admins to update all profiles (e.g., to verify doctors)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- Allow admins to view all consultations
DROP POLICY IF EXISTS "Admins can view all consultations" ON public.consultations;
CREATE POLICY "Admins can view all consultations" ON public.consultations
    FOR SELECT USING (
        auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
