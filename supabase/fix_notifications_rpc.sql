-- Create a secure function to mark messages as read
-- This function runs with SECURITY DEFINER to bypass RLS restrictions on UPDATE
CREATE OR REPLACE FUNCTION mark_conversation_as_read(contact_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all unread messages sent by the contact to the current user
  UPDATE public.messages
  SET read = true
  WHERE receiver_id = auth.uid()
  AND sender_id = contact_id
  AND read = false;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION mark_conversation_as_read(uuid) TO authenticated;
