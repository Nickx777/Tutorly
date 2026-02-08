-- Add calendar sync token to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS calendar_token uuid DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS users_calendar_token_idx ON public.users(calendar_token);

-- Update existing users with tokens if they don't have one
UPDATE public.users SET calendar_token = gen_random_uuid() WHERE calendar_token IS NULL;

-- Function to regenerate token (for security resets)
CREATE OR REPLACE FUNCTION public.regenerate_calendar_token(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token uuid;
BEGIN
  new_token := gen_random_uuid();
  UPDATE public.users SET calendar_token = new_token WHERE id = user_id;
  RETURN new_token;
END;
$$;
