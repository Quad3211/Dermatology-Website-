-- ============================================================
-- Migration 011: Fix Messages Realtime Publication
-- ============================================================
-- The original migration 005 dropped and recreated supabase_realtime,
-- which would wipe any other tables already in the publication.
-- This migration safely adds messages to the existing publication.

-- Safely add messages table to the realtime publication without
-- touching other tables already subscribed.
DO $$
BEGIN
  -- Only add if not already a member of the publication
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END;
$$;
