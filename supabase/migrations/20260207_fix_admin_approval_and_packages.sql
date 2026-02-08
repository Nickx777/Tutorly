-- Add Admin RLS Policies and Custom Packages Support

-- 1. Update Users RLS to allow admins to view and update any record
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Update Teacher Profiles RLS to allow admins to update
DROP POLICY IF EXISTS "Admins can update all teacher profiles" ON public.teacher_profiles;
CREATE POLICY "Admins can update all teacher profiles" ON public.teacher_profiles 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Create teacher_packages table
CREATE TABLE IF NOT EXISTS public.teacher_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lesson_count INTEGER NOT NULL CHECK (lesson_count > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS for teacher_packages
ALTER TABLE public.teacher_packages ENABLE ROW LEVEL SECURITY;

-- 5. Add policies for teacher_packages
DROP POLICY IF EXISTS "Public can view packages" ON public.teacher_packages;
CREATE POLICY "Public can view packages" ON public.teacher_packages 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers can manage own packages" ON public.teacher_packages;
CREATE POLICY "Teachers can manage own packages" ON public.teacher_packages 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles 
      WHERE id = teacher_packages.teacher_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all packages" ON public.teacher_packages;
CREATE POLICY "Admins can manage all packages" ON public.teacher_packages 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
