-- ============================================================
-- COMPLETE FIX: Teacher Auto-Approval Bug
-- Run this ENTIRE script in your Supabase SQL Editor
-- ============================================================

-- 1. FORCE the approved column default to false (in case it was changed)
ALTER TABLE public.teacher_profiles 
  ALTER COLUMN approved SET DEFAULT false;

-- 2. Reset ALL existing teachers to unapproved so admin can re-approve
UPDATE public.teacher_profiles SET approved = false;

-- 3. Fix the RLS policy so teachers can NEVER set their own approved status
DROP POLICY IF EXISTS "Teachers can update own profile" ON teacher_profiles;
CREATE POLICY "Teachers can update own profile"
ON teacher_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND approved = (SELECT tp.approved FROM teacher_profiles tp WHERE tp.user_id = auth.uid())
);

-- 4. Ensure admins can update any teacher profile (for approval)
DROP POLICY IF EXISTS "Admins can update teacher profiles" ON teacher_profiles;
CREATE POLICY "Admins can update teacher profiles"
ON teacher_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 5. Ensure admins can view ALL profiles (including unapproved)
DROP POLICY IF EXISTS "Admins can view all profiles" ON teacher_profiles;
CREATE POLICY "Admins can view all profiles"
ON teacher_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 6. Ensure admins can insert teacher profiles (for the callback)
DROP POLICY IF EXISTS "Admins can insert teacher profiles" ON teacher_profiles;
CREATE POLICY "Admins can insert teacher profiles"
ON teacher_profiles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 7. Fix suspended column: ensure it defaults to false and fix NULL values
ALTER TABLE public.users ALTER COLUMN suspended SET DEFAULT false;
UPDATE public.users SET suspended = false WHERE suspended IS NULL;

-- 8. Force schema cache reload
NOTIFY pgrst, 'reload config';

-- 9. Verify: Show current state of all teacher profiles
SELECT u.email, u.role, u.suspended, tp.approved, tp.user_id
FROM public.users u
LEFT JOIN public.teacher_profiles tp ON tp.user_id = u.id
WHERE u.role = 'teacher';
