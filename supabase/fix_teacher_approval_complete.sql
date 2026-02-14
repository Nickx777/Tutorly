-- ============================================================
-- COMPLETE FIX: Teacher Approval + Admin Visibility
-- Run this ENTIRE script in your Supabase SQL Editor
-- ============================================================

-- =====================================================
-- STEP 1: Fix teacher_profiles SELECT policies
-- The "Public can view approved teachers" policy is hiding
-- unapproved profiles from the admin's getAllUsers query!
-- =====================================================

-- Drop ALL existing SELECT policies on teacher_profiles
DROP POLICY IF EXISTS "Public teacher profiles are viewable by everyone" ON teacher_profiles;
DROP POLICY IF EXISTS "Public can view approved teachers" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can view own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON teacher_profiles;

-- Create correct SELECT policies:
-- 1. Teachers can see their OWN profile (approved or not)
CREATE POLICY "Teachers can view own profile"
ON teacher_profiles FOR SELECT
USING (auth.uid() = user_id);

-- 2. Admins can see ALL profiles (approved or not) - THIS IS CRITICAL
CREATE POLICY "Admins can view all profiles"
ON teacher_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 3. Public can only see APPROVED teachers (for the browse page)
CREATE POLICY "Public can view approved teachers"
ON teacher_profiles FOR SELECT
USING (approved = true);

-- =====================================================
-- STEP 2: Fix teacher_profiles UPDATE policies
-- =====================================================
DROP POLICY IF EXISTS "Teachers can update own profile" ON teacher_profiles;
CREATE POLICY "Teachers can update own profile"
ON teacher_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND approved = (SELECT tp.approved FROM teacher_profiles tp WHERE tp.user_id = auth.uid())
);

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

-- =====================================================
-- STEP 3: Fix teacher_profiles INSERT policies
-- =====================================================
DROP POLICY IF EXISTS "Teachers can insert own profile" ON teacher_profiles;
CREATE POLICY "Teachers can insert own profile"
ON teacher_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

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

-- =====================================================
-- STEP 4: Fix data
-- =====================================================

-- Force approved column default to false
ALTER TABLE public.teacher_profiles ALTER COLUMN approved SET DEFAULT false;

-- Reset ALL teachers to unapproved
UPDATE public.teacher_profiles SET approved = false;

-- Fix suspended column
ALTER TABLE public.users ALTER COLUMN suspended SET DEFAULT false;
UPDATE public.users SET suspended = false WHERE suspended IS NULL;

-- =====================================================
-- STEP 5: Reload and verify
-- =====================================================
NOTIFY pgrst, 'reload config';

-- Show current state
SELECT u.email, u.role, u.suspended, tp.approved, tp.user_id
FROM public.users u
LEFT JOIN public.teacher_profiles tp ON tp.user_id = u.id
WHERE u.role = 'teacher';
