-- Complete fresh schema setup
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: Create all tables
-- =====================================================

-- Teacher profiles
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  bio text,
  subjects text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  hourly_rate integer DEFAULT 0,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  zoom_link text,
  created_at timestamptz DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  content text,
  created_at timestamptz DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  commission_amount integer DEFAULT 0,
  teacher_payout integer DEFAULT 0,
  status text CHECK (status IN ('pending', 'completed', 'refunded')) DEFAULT 'pending',
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now()
);

-- Availability
CREATE TABLE IF NOT EXISTS availability (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 2: Enable RLS
-- =====================================================

ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Create policies (with IF NOT EXISTS check)
-- =====================================================

DO $$
BEGIN
  -- teacher_profiles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teacher_profiles' AND policyname = 'Public teacher profiles are viewable by everyone') THEN
    CREATE POLICY "Public teacher profiles are viewable by everyone" ON teacher_profiles FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teacher_profiles' AND policyname = 'Teachers can update own profile') THEN
    CREATE POLICY "Teachers can update own profile" ON teacher_profiles FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'teacher_profiles' AND policyname = 'Teachers can insert own profile') THEN
    CREATE POLICY "Teachers can insert own profile" ON teacher_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  -- lessons policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Lessons viewable by participants') THEN
    CREATE POLICY "Lessons viewable by participants" ON lessons FOR SELECT USING (auth.uid() = teacher_id OR auth.uid() = student_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Students can book lessons') THEN
    CREATE POLICY "Students can book lessons" ON lessons FOR INSERT WITH CHECK (auth.uid() = student_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Participants can update own lessons') THEN
    CREATE POLICY "Participants can update own lessons" ON lessons FOR UPDATE USING (auth.uid() = teacher_id OR auth.uid() = student_id);
  END IF;

  -- reviews policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Reviews viewable by everyone') THEN
    CREATE POLICY "Reviews viewable by everyone" ON reviews FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Students can create reviews') THEN
    CREATE POLICY "Students can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = student_id);
  END IF;

  -- payments policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can view own payments') THEN
    CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = student_id OR auth.uid() = teacher_id);
  END IF;

  -- availability policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'availability' AND policyname = 'Availability viewable by everyone') THEN
    CREATE POLICY "Availability viewable by everyone" ON availability FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'availability' AND policyname = 'Teachers can manage own availability') THEN
    CREATE POLICY "Teachers can manage own availability" ON availability FOR ALL USING (auth.uid() = teacher_id);
  END IF;

END $$;
