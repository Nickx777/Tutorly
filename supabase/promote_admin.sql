-- Make admin@admin.com an admin
-- Run this in Supabase SQL Editor

-- Ensure the user has the admin role
UPDATE public.users 
SET role = 'admin', full_name = 'System Admin'
WHERE email = 'admin@admin.com';

-- Verify
SELECT * FROM public.users WHERE email = 'admin@admin.com';
