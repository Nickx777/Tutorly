-- Consolidated Schema Sync for Teacher Profiles
-- Run this in your Supabase SQL Editor to fix 400 errors during profile save

-- 1. Ensure group_rate exists
ALTER TABLE public.teacher_profiles 
ADD COLUMN IF NOT EXISTS group_rate NUMERIC(10, 2);

-- 2. Add constraint for group_rate if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_rate_not_more_than_hourly_rate') THEN
        ALTER TABLE public.teacher_profiles
        ADD CONSTRAINT group_rate_not_more_than_hourly_rate 
        CHECK (group_rate IS NULL OR group_rate <= hourly_rate);
    END IF;
END $$;

-- 3. Ensure other common missing columns from schema_updates.sql are present
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 4. Note: We have REMOVED package_rate from the application code to favor the teacher_packages table.
-- If you have an existing package_rate column, it will now be ignored by the app.

COMMENT ON COLUMN public.teacher_profiles.group_rate IS 'Discounted hourly rate for group sessions';
