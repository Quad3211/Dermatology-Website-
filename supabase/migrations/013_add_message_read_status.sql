-- ============================================================
-- Migration 013: Add Message Read Status
-- ============================================================

-- Add is_read column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Add index for performance on filtering by read status
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- Update existing messages to be marked as read (optional, depends on if we want legacy to be "read")
-- UPDATE public.messages SET is_read = true; 
