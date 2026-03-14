-- ============================================================
-- Migration 007: Wipe Data Utility
-- ============================================================

BEGIN;

-- clear all consultations
DELETE FROM public.consultations;

-- clear AI results
DELETE FROM public.analysis_results;

-- clear upload records
DELETE FROM public.uploads;

COMMIT;
