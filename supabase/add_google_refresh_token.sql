-- Add google_refresh_token to users table for background calendar sync
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS google_refresh_token text;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';
