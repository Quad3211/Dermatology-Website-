-- ============================================================
-- Migration 005: Text Chat Messages Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create the messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_role user_role NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by consultation
CREATE INDEX IF NOT EXISTS idx_messages_consultation_id ON public.messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Patients can read messages for their own consultations
DROP POLICY IF EXISTS "patients_read_own_messages" ON public.messages;
CREATE POLICY "patients_read_own_messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.consultations c
            WHERE c.id = messages.consultation_id
            AND c.patient_id = auth.uid()
        )
    );

-- Patients can insert messages for their own consultations
DROP POLICY IF EXISTS "patients_insert_own_messages" ON public.messages;
CREATE POLICY "patients_insert_own_messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.consultations c
            WHERE c.id = messages.consultation_id
            AND c.patient_id = auth.uid()
        )
        AND sender_id = auth.uid()
    );

-- Doctors can read messages for any consultation
DROP POLICY IF EXISTS "doctors_read_all_messages" ON public.messages;
CREATE POLICY "doctors_read_all_messages"
    ON public.messages FOR SELECT
    TO authenticated
    USING (public.current_user_role() IN ('doctor', 'admin'));

-- Doctors can insert messages for any consultation
DROP POLICY IF EXISTS "doctors_insert_any_message" ON public.messages;
CREATE POLICY "doctors_insert_any_message"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        public.current_user_role() IN ('doctor', 'admin')
        AND sender_id = auth.uid()
    );

-- Enable realtime for messages
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
