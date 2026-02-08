-- Comprehensive Fix Script
-- Run this entire script in Supabase SQL Editor

-- 1. Ensure public.users has the user
INSERT INTO public.users (id, full_name, avatar_url, email, role)
SELECT 
  id,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url',
  email,
  COALESCE(raw_user_meta_data->>'role', 'student')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure teacher_profiles has the user (just in case availability references this)
INSERT INTO public.teacher_profiles (id, user_id, bio, hourly_rate)
SELECT 
  gen_random_uuid(),
  id,
  'New teacher',
  30
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.teacher_profiles)
ON CONFLICT DO NOTHING;

-- 3. Verify Constraint (Optional - just prints info)
DO $$
DECLARE
    fk_target text;
BEGIN
    SELECT ccu.table_name INTO fk_target
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'availability' AND tc.constraint_type = 'FOREIGN KEY' LIMIT 1;
    
    RAISE NOTICE 'Availability table references: %', fk_target;
END $$;
