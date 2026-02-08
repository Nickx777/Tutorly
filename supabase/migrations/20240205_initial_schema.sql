-- Initial Schema for Tutorly (Safe to Re-run)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teacher profiles table
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  subjects TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  package_rate DECIMAL(10,2),
  timezone TEXT DEFAULT 'UTC',
  approved BOOLEAN DEFAULT FALSE,
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_teacher_user UNIQUE (user_id)
);

-- Lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('one_on_one', 'group')),
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  max_students INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability table
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id),
  student_id UUID NOT NULL REFERENCES public.users(id),
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  zoom_meeting_id TEXT,
  zoom_join_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id),
  student_id UUID NOT NULL REFERENCES public.users(id),
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;

DROP POLICY IF EXISTS "Public can view approved teachers" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Public can view teacher profiles" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Teachers can update own profile" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Teachers can insert own profile" ON public.teacher_profiles;
DROP POLICY IF EXISTS "Enable insert for teachers" ON public.teacher_profiles;

DROP POLICY IF EXISTS "Public can view lessons" ON public.lessons;
DROP POLICY IF EXISTS "Teachers can manage own lessons" ON public.lessons;


-- Users policies
CREATE POLICY "Users can view own profile" ON public.users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users" ON public.users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Teacher profiles policies
CREATE POLICY "Public can view approved teachers" ON public.teacher_profiles 
  FOR SELECT USING (true);

CREATE POLICY "Teachers can update own profile" ON public.teacher_profiles 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Teachers can insert own profile" ON public.teacher_profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Lessons policies
CREATE POLICY "Public can view lessons" ON public.lessons 
  FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own lessons" ON public.lessons 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles 
      WHERE id = lessons.teacher_id AND user_id = auth.uid()
    )
  );

-- Function to handle new user signup (idempotent replacement)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING; -- Avoid error if user already exists
  
  -- Create empty teacher profile if role is teacher
  IF (new.raw_user_meta_data->>'role' = 'teacher') THEN
    INSERT INTO public.teacher_profiles (user_id)
    VALUES (new.id)
    ON CONFLICT (user_id) DO NOTHING; -- Avoid duplicate teacher profiles
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
