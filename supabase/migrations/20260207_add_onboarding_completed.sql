-- Add onboarding_completed column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing users to have completed onboarding (assumed)
-- Or leave as FALSE if we want to force them through it. 
-- For safety, let's mark existing admins/teachers as TRUE to avoid locking them out effectively
UPDATE public.users SET onboarding_completed = TRUE WHERE role IN ('admin', 'teacher');
-- Students might need onboarding so we leave them or set TRUE based on preference.
-- Let's set ALL existing users to TRUE to avoid disrupting current flow, 
-- and only new users will face the onboarding.
UPDATE public.users SET onboarding_completed = TRUE;
