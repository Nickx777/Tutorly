-- Fix Admin RLS Policies using JWT metadata instead of table lookups to avoid circular dependencies

-- 1. Update Users RLS
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users 
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users 
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 2. Update Teacher Profiles RLS
DROP POLICY IF EXISTS "Admins can update all teacher profiles" ON public.teacher_profiles;
CREATE POLICY "Admins can update all teacher profiles" ON public.teacher_profiles 
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Also add SELECT policy for admins on teacher profiles just in case
DROP POLICY IF EXISTS "Admins can view all teacher profiles" ON public.teacher_profiles;
CREATE POLICY "Admins can view all teacher profiles" ON public.teacher_profiles 
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
    approved = true OR 
    (auth.uid() = user_id)
  );

-- 3. Update Teacher Packages RLS
DROP POLICY IF EXISTS "Admins can manage all packages" ON public.teacher_packages;
CREATE POLICY "Admins can manage all packages" ON public.teacher_packages 
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- 4. Update Student Packages RLS
DROP POLICY IF EXISTS "Admins can manage all student packages" ON public.student_packages;
CREATE POLICY "Admins can manage all student packages" ON public.student_packages
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
