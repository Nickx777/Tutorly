-- Consolidated Messaging Fix
-- 1. Ensure Realtime is enabled
ALTER publication supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. Ensure RLS policies are correct (Using EXISTS to avoid errors if they don't exist, but dropping first is safer)
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- 3. Ensure 'read' column is updatable by receiver
DROP POLICY IF EXISTS "Users can update their own received messages" ON public.messages;
CREATE POLICY "Users can update their own received messages"
ON public.messages FOR UPDATE
USING (auth.uid() = receiver_id);

NOTIFY pgrst, 'reload config';
