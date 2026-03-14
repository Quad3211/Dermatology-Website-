-- ============================================================
-- Migration 004: Schema Fixes
-- ============================================================

-- auto-create profile on signup
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

-- auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- backfill existing users
INSERT INTO public.profiles (id, full_name, role)
SELECT
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    COALESCE((au.raw_user_meta_data->>'role')::user_role, 'patient')
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- make analysis_id nullable
ALTER TABLE public.consultations
    ALTER COLUMN analysis_id DROP NOT NULL;

-- fix preferred_date type
ALTER TABLE public.consultations
    ALTER COLUMN preferred_date TYPE TIMESTAMPTZ
    USING preferred_date::TIMESTAMPTZ;

-- storage bucket config
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'skin-images',
    'skin-images',
    false,
    10485760,   -- 10MB max
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- users upload to own folder
DROP POLICY IF EXISTS "patients_can_upload" ON storage.objects;
CREATE POLICY "patients_can_upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'skin-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- users read own files
DROP POLICY IF EXISTS "patients_can_read_own" ON storage.objects;
CREATE POLICY "patients_can_read_own"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'skin-images'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- doctors read all files
DROP POLICY IF EXISTS "doctors_can_read_all" ON storage.objects;
CREATE POLICY "doctors_can_read_all"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'skin-images'
        AND public.current_user_role() IN ('doctor', 'admin')
    );
