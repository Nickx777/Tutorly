-- Feature: Auto-Confirm Bookings Support
-- 1. Add preference column to teacher_profiles
ALTER TABLE public.teacher_profiles 
ADD COLUMN IF NOT EXISTS auto_accept_bookings BOOLEAN DEFAULT TRUE;

-- 2. Ensure RLS allows reading/updating this (owners only)
-- (Existing policies should cover UPDATE for owner, SELECT for public)

-- Force reload schema cache
NOTIFY pgrst, 'reload config';
