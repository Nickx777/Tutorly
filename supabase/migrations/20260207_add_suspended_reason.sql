-- Add suspended_reason column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
