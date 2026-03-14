-- Migration: 007_wipe_data.sql
-- Description: Wipes all transactional data (consultations, analysis results, uploads, messages)
-- leaving only the profiles (users). To run this, execute it in the Supabase SQL Editor.

BEGIN;

-- 1. (Skipping public.messages as it does not exist in this branch)
-- 2. Delete all consultation records
DELETE FROM public.consultations;

-- 3. Delete AI analysis results
DELETE FROM public.analysis_results;

-- 4. Delete all user image upload records
DELETE FROM public.uploads;

-- If you also want to delete all user profiles (except your own admin account), uncomment below:
-- DELETE FROM public.profiles WHERE role != 'admin';

COMMIT;
