-- Final fix - Add missing columns then create policies

-- =====================================================
-- STEP 1: Ensure all tables exist with correct columns
-- =====================================================

-- Lessons table
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

-- Add student_id if missing (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'student_id') THEN
    ALTER TABLE lessons ADD COLUMN student_id uuid REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  content text,
  created_at timestamptz DEFAULT now()
);

-- Add student_id if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'student_id') THEN
    ALTER TABLE reviews ADD COLUMN student_id uuid REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Payments table
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

-- Add student_id if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'student_id') THEN
    ALTER TABLE payments ADD COLUMN student_id uuid REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

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

ALTER TABLE IF EXISTS teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS availability ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Drop existing policies to avoid conflicts
-- =====================================================

DROP POLICY IF EXISTS "Public teacher profiles are viewable by everyone" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can update own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can insert own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Lessons viewable by participants" ON lessons;
DROP POLICY IF EXISTS "Students can book lessons" ON lessons;
DROP POLICY IF EXISTS "Participants can update own lessons" ON lessons;
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Students can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Availability viewable by everyone" ON availability;
DROP POLICY IF EXISTS "Teachers can manage own availability" ON availability;

-- =====================================================
-- STEP 4: Create policies
-- =====================================================

-- teacher_profiles
CREATE POLICY "Public teacher profiles are viewable by everyone" ON teacher_profiles FOR SELECT USING (true);
CREATE POLICY "Teachers can update own profile" ON teacher_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Teachers can insert own profile" ON teacher_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- lessons
CREATE POLICY "Lessons viewable by participants" ON lessons FOR SELECT USING (auth.uid() = teacher_id OR auth.uid() = student_id);
CREATE POLICY "Students can book lessons" ON lessons FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Participants can update own lessons" ON lessons FOR UPDATE USING (auth.uid() = teacher_id OR auth.uid() = student_id);

-- reviews
CREATE POLICY "Reviews viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Students can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = student_id);

-- payments
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = student_id OR auth.uid() = teacher_id);

-- availability
CREATE POLICY "Availability viewable by everyone" ON availability FOR SELECT USING (true);
CREATE POLICY "Teachers can manage own availability" ON availability FOR ALL USING (auth.uid() = teacher_id);
