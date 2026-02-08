-- Add Zoom OAuth credentials to users table
-- These fields store the teacher's connected Zoom account tokens

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS zoom_access_token TEXT,
ADD COLUMN IF NOT EXISTS zoom_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS zoom_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS zoom_user_id TEXT;

-- Add index for quick lookup of users with Zoom connected
CREATE INDEX IF NOT EXISTS idx_users_zoom_connected 
ON public.users (id) 
WHERE zoom_refresh_token IS NOT NULL;

-- Ensure lessons table has zoom_link column (should already exist)
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS zoom_link TEXT,
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT;

COMMENT ON COLUMN public.users.zoom_access_token IS 'Zoom OAuth access token';
COMMENT ON COLUMN public.users.zoom_refresh_token IS 'Zoom OAuth refresh token for token renewal';
COMMENT ON COLUMN public.users.zoom_token_expires_at IS 'When the access token expires';
COMMENT ON COLUMN public.users.zoom_user_id IS 'Zoom user ID from the connected account';
