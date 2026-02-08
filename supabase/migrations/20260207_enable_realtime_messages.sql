-- Enable real-time for messages by adding it to the supabase_realtime publication
ALTER publication supabase_realtime ADD TABLE public.messages;

-- Ensure updates send the full record (important for state sync in frontend)
ALTER TABLE public.messages REPLICA IDENTITY FULL;
