-- Admin Access Policies
-- Run this in Supabase SQL Editor
-- Grants full access to 'admin@admin.com' on all key tables

-- Function to check if user is admin (based on email for safety/bootstrapping)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') = 'admin@admin.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. USERS
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
CREATE POLICY "Admins can manage users" ON public.users
    FOR ALL USING (public.is_admin());

-- 2. TEACHER PROFILES
DROP POLICY IF EXISTS "Admins can manage teacher profiles" ON public.teacher_profiles;
CREATE POLICY "Admins can manage teacher profiles" ON public.teacher_profiles
    FOR ALL USING (public.is_admin());

-- 3. LESSONS
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
CREATE POLICY "Admins can manage lessons" ON public.lessons
    FOR ALL USING (public.is_admin());

-- 4. BOOKINGS
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.bookings;
CREATE POLICY "Admins can manage bookings" ON public.bookings
    FOR ALL USING (public.is_admin());

-- 5. REVIEWS
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews" ON public.reviews
    FOR ALL USING (public.is_admin());

-- 6. AVAILABILITY
DROP POLICY IF EXISTS "Admins can manage availability" ON public.availability;
CREATE POLICY "Admins can manage availability" ON public.availability
    FOR ALL USING (public.is_admin());

-- 7. PAYMENTS (If table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments';
        EXECUTE 'CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL USING (public.is_admin())';
    END IF;
END
$$;

SELECT 'Admin policies applied successfully!' as status;
