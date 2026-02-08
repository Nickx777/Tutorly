-- Add Student Packages support and track lesson balances

-- 1. Create student_packages table to track purchased bulk lessons
CREATE TABLE IF NOT EXISTS public.student_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.teacher_packages(id) ON DELETE CASCADE,
  total_lessons INTEGER NOT NULL,
  remaining_lessons INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'exhausted', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add package tracking to lessons table
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.teacher_packages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS student_package_id UUID REFERENCES public.student_packages(id) ON DELETE SET NULL;

-- 3. Enable RLS for student_packages
ALTER TABLE public.student_packages ENABLE ROW LEVEL SECURITY;

-- 4. Policies for student_packages
DROP POLICY IF EXISTS "Students can view own packages" ON public.student_packages;
CREATE POLICY "Students can view own packages" ON public.student_packages
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can view packages bought from them" ON public.student_packages;
CREATE POLICY "Teachers can view packages bought from them" ON public.student_packages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE id = student_packages.teacher_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all student packages" ON public.student_packages;
CREATE POLICY "Admins can manage all student packages" ON public.student_packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Add function to automatically decrease remaining_lessons when a lesson is booked
-- This could also be handled by the API, but a trigger is safer.
-- For now, we'll handle it in the API for better control and error reporting.
