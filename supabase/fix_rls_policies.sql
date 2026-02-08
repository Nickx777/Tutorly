-- Fix RLS Policies for new Schema (Users ID references)

-- 1. LESSONS: Update policy to use teacher_id directly (it now references users.id)
DROP POLICY IF EXISTS "Teachers can manage own lessons" ON public.lessons;
CREATE POLICY "Teachers can manage own lessons" 
ON public.lessons 
FOR ALL USING (
  auth.uid() = teacher_id
);

-- 2. TEACHER_PROFILES: Fix policy (user_id is correct, but ensure consistency)
DROP POLICY IF EXISTS "Teachers can update own profile" ON public.teacher_profiles;
CREATE POLICY "Teachers can update own profile"
ON public.teacher_profiles
FOR UPDATE USING (auth.uid() = user_id);

-- 3. AVAILABILITY: Fix policy (teacher_id references users.id)
DROP POLICY IF EXISTS "Teachers can manage own availability" ON public.availability;
CREATE POLICY "Teachers can manage own availability" 
ON public.availability
FOR ALL USING (
  auth.uid() = teacher_id
);

-- 4. BOOKINGS: Update policies (teacher_id references users.id)
DROP POLICY IF EXISTS "Teachers can manage own bookings" ON public.bookings;
CREATE POLICY "Teachers can manage own bookings" 
ON public.bookings 
FOR ALL USING (
  auth.uid() = teacher_id OR auth.uid() = student_id
);

-- 5. REVIEWS: Update policies 
DROP POLICY IF EXISTS "Students can create reviews" ON public.reviews;
CREATE POLICY "Students can create reviews"
ON public.reviews
FOR INSERT WITH CHECK (auth.uid() = student_id);

-- 6. Make sure authenticated users can insert bookings
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
CREATE POLICY "Authenticated users can create bookings" 
ON public.bookings 
FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Force reload
NOTIFY pgrst, 'reload config';
