-- Force update Admin user role and metadata to ensure they are correct
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  jsonb_set(raw_user_meta_data, '{role}', '"admin"'),
  '{onboarding_completed}', 'true'
)
WHERE email = 'admin@admin.com';

UPDATE public.users
SET role = 'admin', onboarding_completed = true
WHERE email = 'admin@admin.com';
