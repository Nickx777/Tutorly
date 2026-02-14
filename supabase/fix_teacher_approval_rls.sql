-- Fix: Prevent teachers from self-approving via RLS
-- Teachers should only be approved by admins through the admin dashboard.

-- Drop the old overly-permissive update policy
DROP POLICY IF EXISTS "Teachers can update own profile" ON teacher_profiles;

-- Create a new policy that prevents teachers from changing their own approval status
-- The WITH CHECK ensures that after the update, `approved` still equals its previous value.
CREATE POLICY "Teachers can update own profile"
ON teacher_profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND approved = (SELECT tp.approved FROM teacher_profiles tp WHERE tp.user_id = auth.uid())
);
