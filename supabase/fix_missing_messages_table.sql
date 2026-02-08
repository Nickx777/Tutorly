-- Standalone Fix: Create Missing Messages Table
-- This script ensures the messages table and its RLS policies are properly set up.

-- 1. Create the messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- 4. Reload Schema Cache
NOTIFY pgrst, 'reload config';

-- 5. Diagnostic: List columns to verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages';
