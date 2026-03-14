-- ============================================================
-- Migration 008: Sync Admin Role to Auth Metadata
-- Run this in Supabase SQL Editor
-- ============================================================

-- This script ensures that any user who was manually granted the 'admin' 
-- role in the public.profiles table also has their underlying Supabase Genkit
-- Authentication token (auth.users) updated to reflect 'admin'.

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
FROM public.profiles p
WHERE p.id = auth.users.id 
  AND p.role = 'admin';
