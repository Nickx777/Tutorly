-- Fix Visibility: Allow teachers to see their own profile & Admins to see ALL profiles.

-- 1. Fix Teacher View (so they don't see "Waiting" if they are approved, or can see status correctly)
DROP POLICY IF EXISTS "Teachers can view own profile" ON public.teacher_profiles;
CREATE POLICY "Teachers can view own profile"
ON public.teacher_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Fix Admin View (so they can see Unapproved teachers as "Pending" instead of falsely "Active")
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

-- Note: Ensure existing "Public can view approved teachers" policy exists or create it if missing
-- asking public to only see approved ones
DROP POLICY IF EXISTS "Public can view approved teachers" ON public.teacher_profiles;
CREATE POLICY "Public can view approved teachers"
ON public.teacher_profiles
FOR SELECT
USING (approved = true);

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
