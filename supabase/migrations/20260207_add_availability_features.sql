-- Add buffer time settings to teacher_profiles
ALTER TABLE public.teacher_profiles
ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_buffer_enabled BOOLEAN DEFAULT FALSE;

-- Create teacher_time_off table
CREATE TABLE IF NOT EXISTS public.teacher_time_off (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT end_date_after_start_date CHECK (end_date >= start_date)
);

-- Enable RLS for time off
ALTER TABLE public.teacher_time_off ENABLE ROW LEVEL SECURITY;

-- Time Off Policies
-- Drop existing policies if they exist (to be safe for re-runs)
DROP POLICY IF EXISTS "Teachers can manage own time off" ON public.teacher_time_off;
DROP POLICY IF EXISTS "Public can view teacher time off" ON public.teacher_time_off;

CREATE POLICY "Teachers can manage own time off" ON public.teacher_time_off
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE id = teacher_time_off.teacher_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view teacher time off" ON public.teacher_time_off
  FOR SELECT USING (true);

-- Create availability_patterns table (for recurring sets)
CREATE TABLE IF NOT EXISTS public.availability_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  days_of_week INTEGER[] NOT NULL, -- Array of days (0-6)
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for patterns
ALTER TABLE public.availability_patterns ENABLE ROW LEVEL SECURITY;

-- Pattern Policies
DROP POLICY IF EXISTS "Teachers can manage own patterns" ON public.availability_patterns;

CREATE POLICY "Teachers can manage own patterns" ON public.availability_patterns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles
      WHERE id = availability_patterns.teacher_id AND user_id = auth.uid()
    )
  );

-- Add pattern_id to availability to link generated slots
ALTER TABLE public.availability
ADD COLUMN IF NOT EXISTS pattern_id UUID REFERENCES public.availability_patterns(id) ON DELETE CASCADE;
