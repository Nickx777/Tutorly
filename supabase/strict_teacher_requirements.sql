-- Migration: Strict Teacher Requirements and Subject-Specific Availability

-- 1. Add timezone to teacher_profiles
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS timezone TEXT;

-- 2. Add subject to availability
ALTER TABLE public.availability ADD COLUMN IF NOT EXISTS subject TEXT;

-- 3. Enhance teacher_profiles with a completion flag if needed, 
-- but we can just check if required fields are non-null in the UI.

-- 4. Update existing policies if necessary (usually they are fine as 'ALL' or 'FOR SELECT')

-- 5. Create a basic messaging table
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Provide a hint to the schema cache
NOTIFY pgrst, 'reload config';
