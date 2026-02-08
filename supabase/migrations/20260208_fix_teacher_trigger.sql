-- Restore teacher profile creation to the on_auth_user_created trigger
-- This ensures that new teachers automatically get a teacher_profiles record
-- preventing the "No Profile" status in the admin dashboard.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- 1. Insert/Update into public.users
    INSERT INTO public.users (id, email, full_name, role, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();

    -- 2. Create teacher profile if role is teacher
    IF (COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'teacher') THEN
        INSERT INTO public.teacher_profiles (user_id, approved)
        VALUES (NEW.id, false)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- DATA FIX: Create missing profiles for existing teachers who are stuck in "No Profile" state
INSERT INTO public.teacher_profiles (user_id, approved)
SELECT id, false
FROM public.users
WHERE role = 'teacher'
AND NOT EXISTS (
    SELECT 1 FROM public.teacher_profiles WHERE user_id = public.users.id
)
ON CONFLICT (user_id) DO NOTHING;
