-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow users to view messages sent to or by them
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Allow users to insert messages where they are the sender
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
CREATE POLICY "Users can insert own messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Allow users to update messages where they are the RECEIVER (e.g. mark as read)
DROP POLICY IF EXISTS "Users can update received messages" ON public.messages;
CREATE POLICY "Users can update received messages"
ON public.messages FOR UPDATE
USING (auth.uid() = receiver_id);

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
