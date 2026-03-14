-- ============================================================
-- Migration 008: Sync Admin Role to Auth Metadata
-- ============================================================

-- sync admin role to JWT metadata
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
FROM public.profiles p
WHERE p.id = auth.users.id 
  AND p.role = 'admin';
