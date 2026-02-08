-- Consolidated Fix for Settings & Real-Time Messaging
-- Run this in your Supabase SQL Editor

-- 1. Ensure calendar_token exists on public.users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS calendar_token uuid DEFAULT gen_random_uuid();

-- 2. Create unique index and backfill if missing
CREATE UNIQUE INDEX IF NOT EXISTS users_calendar_token_idx ON public.users(calendar_token);
UPDATE public.users SET calendar_token = gen_random_uuid() WHERE calendar_token IS NULL;

-- 3. Backfill any missing users from auth.users to public.users
-- This ensures that "Error loading user data" (profile not found) is resolved.
INSERT INTO public.users (id, full_name, avatar_url, email, role)
SELECT 
  id,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url',
  email,
  COALESCE(raw_user_meta_data->>'role', 'student')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable Real-Time messaging for the messages table
-- This resolves the "must refresh to see new messages" bug.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    ALTER publication supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- Enable full replication so updates (like read status) are streamed correctly
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 5. Force schema cache reload
NOTIFY pgrst, 'reload config';
