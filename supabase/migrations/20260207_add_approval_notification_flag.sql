-- Add notification flag for teacher approval
ALTER TABLE public.teacher_profiles
ADD COLUMN IF NOT EXISTS show_approval_notification BOOLEAN DEFAULT FALSE;
