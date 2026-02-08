-- Allow teachers to UPDATE their own profile
-- This fixes the issue where profile changes (Bio, Rate, Subjects) are not saved.

DROP POLICY IF EXISTS "Teachers can update own profile" ON public.teacher_profiles;

CREATE POLICY "Teachers can update own profile"
ON public.teacher_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
