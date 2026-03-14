-- ============================================================
-- Migration 004: Schema Fixes
-- Run this in Supabase SQL Editor
-- ============================================================

-- Fix 1: Auto-create profile on user signup
-- Without this, current_user_role() returns NULL → all RLS checks fail → uploads blocked
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'patient')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Drop if it already exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix 2: Back-fill profiles for any existing auth users who have no profile
INSERT INTO public.profiles (id, full_name, role)
SELECT
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    COALESCE((au.raw_user_meta_data->>'role')::user_role, 'patient')
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- Fix 3: Make analysis_id nullable on consultations
-- Patients should be able to book a consultation even if AI analysis isn't complete yet
ALTER TABLE public.consultations
    ALTER COLUMN analysis_id DROP NOT NULL;

-- Fix 4: Change preferred_date from DATE to TIMESTAMPTZ to store time too
ALTER TABLE public.consultations
    ALTER COLUMN preferred_date TYPE TIMESTAMPTZ
    USING preferred_date::TIMESTAMPTZ;

-- Fix 5: Storage bucket policies for skin-images
-- (Run AFTER creating the bucket in Supabase Dashboard → Storage → New bucket "skin-images")
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'skin-images',
    'skin-images',
    false,
    10485760,   -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow patients to upload to their own user-id folder
DROP POLICY IF EXISTS "patients_can_upload" ON storage.objects;
CREATE POLICY "patients_can_upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'skin-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to read their own files
DROP POLICY IF EXISTS "patients_can_read_own" ON storage.objects;
CREATE POLICY "patients_can_read_own"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'skin-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow doctors to read any patient image (for review portal)
DROP POLICY IF EXISTS "doctors_can_read_all" ON storage.objects;
CREATE POLICY "doctors_can_read_all"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'skin-images'
        AND public.current_user_role() IN ('doctor', 'admin')
    );
