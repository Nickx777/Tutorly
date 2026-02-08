-- Create student_profiles table
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  interests TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_user UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Students can manage own profile" ON public.student_profiles;
CREATE POLICY "Students can manage own profile" ON public.student_profiles
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.student_profiles;
CREATE POLICY "Teachers can view student profiles" ON public.student_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'teacher')
  );

DROP POLICY IF EXISTS "Admins can view student profiles" ON public.student_profiles;
CREATE POLICY "Admins can view student profiles" ON public.student_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
