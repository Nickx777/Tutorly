-- 1. Unapprove ALL teachers (Resetting state for testing)
UPDATE public.teacher_profiles
SET approved = false, show_approval_notification = false;

-- 2. Ensure every 'teacher' user actually has a 'teacher_profiles' record
-- This fixes the "teacher didn't appear" issue if the signup trigger failed.
INSERT INTO public.teacher_profiles (user_id)
SELECT id FROM public.users
WHERE role = 'teacher'
AND NOT EXISTS (
    SELECT 1 FROM public.teacher_profiles WHERE user_id = users.id
);

-- 3. Re-Verify Admin Visibility (Ensuring Admins can see these unapproved profiles)
-- If this policy is missing, Admins can't see the unapproved rows to approve them.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.teacher_profiles;
CREATE POLICY "Admins can view all profiles"
ON public.teacher_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Force schema cache reload just in case
NOTIFY pgrst, 'reload config';
