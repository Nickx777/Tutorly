-- Check auth.users for metadata
SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'admin@admin.com';

-- Check public.users for role and onboarding status
SELECT id, email, role, onboarding_completed FROM public.users WHERE email = 'admin@admin.com';
