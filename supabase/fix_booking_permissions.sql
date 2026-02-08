-- CRITICAL FIX for Booking System
-- The app uses the 'lessons' table to store bookings, not the 'bookings' table.
-- We must grant permissions on 'lessons' for students to Insert and Update.

-- 1. Enable students to Create Bookings (Insert into lessons)
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.lessons;
CREATE POLICY "Authenticated users can create bookings" 
ON public.lessons 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'); 
-- Note: We trust the API to validate student_id = auth.uid()

-- 2. Allow Students to Update their own lessons (e.g. cancel)
DROP POLICY IF EXISTS "Students can updown own lessons" ON public.lessons;
CREATE POLICY "Students can update own lessons"
ON public.lessons
FOR UPDATE
USING (auth.uid() = student_id);

-- 3. Allow Teachers to Update their own lessons (confirm/complete)
DROP POLICY IF EXISTS "Teachers can update own lessons" ON public.lessons;
CREATE POLICY "Teachers can update own lessons"
ON public.lessons
FOR UPDATE
USING (auth.uid() = teacher_id);

-- 4. Ensure Availability is publicly readable (Double check)
DROP POLICY IF EXISTS "Public can view availability" ON public.availability;
CREATE POLICY "Public can view availability" 
ON public.availability FOR SELECT USING (true);

-- 5. Ensure Lessons are readable by involved parties (in case Public view is disabled later)
-- (We keep the Public View policy from previous fix as a fallback, no need to delete it)

-- Force schema reload
NOTIFY pgrst, 'reload config';
