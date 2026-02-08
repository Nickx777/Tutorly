-- Fix public.users role for admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@admin.com';

-- Fix auth.users metadata for admin
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@admin.com';
