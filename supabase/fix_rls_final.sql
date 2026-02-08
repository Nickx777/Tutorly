-- FINAL RLS FIX (Read Permissions)

-- 1. Allow everyone to see Lessons (needed for availability checks)
DROP POLICY IF EXISTS "Public can view lessons" ON public.lessons;
CREATE POLICY "Public can view lessons" 
ON public.lessons FOR SELECT USING (true);


-- 2. Allow everyone to see Basic User Info (needed for displaying names/avatars)
--    The app joins 'users' table to show Teacher/Student names.
DROP POLICY IF EXISTS "Public can view users" ON public.users;
CREATE POLICY "Public can view users" 
ON public.users FOR SELECT USING (true);


-- 3. Allow Students to see their own Bookings
DROP POLICY IF EXISTS "Students can view own bookings" ON public.bookings;
CREATE POLICY "Students can view own bookings"
ON public.bookings FOR SELECT USING (auth.uid() = student_id);


-- 4. Allow Teachers to see their own Bookings (re-verify)
DROP POLICY IF EXISTS "Teachers can view own bookings" ON public.bookings;
CREATE POLICY "Teachers can view own bookings"
ON public.bookings FOR SELECT USING (auth.uid() = teacher_id);


-- Force schema cache reload
NOTIFY pgrst, 'reload config';
