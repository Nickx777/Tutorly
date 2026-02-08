-- Fix user creation trigger and create demo users
-- Run this in Supabase SQL Editor

-- First, let's check and fix the users table structure
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Make sure role has a default
ALTER TABLE public.users 
ALTER COLUMN role SET DEFAULT 'student';

-- Drop and recreate the trigger function to handle user creation properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Now you can create users in the dashboard
-- After creating them, run the SQL below to set up profiles:

-- UPDATE after creating users in dashboard:
-- UPDATE public.users SET role = 'teacher', full_name = 'Demo Teacher' WHERE email = 'demo@teacher.com';
-- UPDATE public.users SET role = 'student', full_name = 'Demo Student' WHERE email = 'demo@student.com';

SELECT 'Trigger fixed! Now create users in Authentication > Users > Add User' as message;
