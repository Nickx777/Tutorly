-- Clean slate - Drop all policies first
DO $$
BEGIN
    -- Drop policies for teacher_profiles
    DROP POLICY IF EXISTS "Public teacher profiles are viewable by everyone" ON teacher_profiles;
    DROP POLICY IF EXISTS "Teachers can update own profile" ON teacher_profiles;
    DROP POLICY IF EXISTS "Teachers can insert own profile" ON teacher_profiles;
    
    -- Drop policies for lessons
    DROP POLICY IF EXISTS "Lessons viewable by participants" ON lessons;
    DROP POLICY IF EXISTS "Students can book lessons" ON lessons;
    DROP POLICY IF EXISTS "Participants can update own lessons" ON lessons;
    
    -- Drop policies for reviews
    DROP POLICY IF EXISTS "Reviews viewable by everyone" ON reviews;
    DROP POLICY IF EXISTS "Students can create reviews" ON reviews;
    
    -- Drop policies for payments
    DROP POLICY IF EXISTS "Users can view own payments" ON payments;
    
    -- Drop policies for availability
    DROP POLICY IF EXISTS "Availability viewable by everyone" ON availability;
    DROP POLICY IF EXISTS "Teachers can manage own availability" ON availability;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- Drop tables if they exist (cascade to remove dependencies)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS teacher_profiles CASCADE;

-- Now create tables fresh

-- Teacher profiles
CREATE TABLE teacher_profiles (
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
CREATE TABLE lessons (
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
CREATE TABLE reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  content text,
  created_at timestamptz DEFAULT now()
);

-- Payments
CREATE TABLE payments (
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
CREATE TABLE availability (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Create policies for teacher_profiles
CREATE POLICY "Public teacher profiles are viewable by everyone"
ON teacher_profiles FOR SELECT USING (true);

CREATE POLICY "Teachers can update own profile"
ON teacher_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Teachers can insert own profile"
ON teacher_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for lessons
CREATE POLICY "Lessons viewable by participants"
ON lessons FOR SELECT USING (auth.uid() = teacher_id OR auth.uid() = student_id);

CREATE POLICY "Students can book lessons"
ON lessons FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can update own lessons"
ON lessons FOR UPDATE USING (auth.uid() = teacher_id OR auth.uid() = student_id);

-- Create policies for reviews
CREATE POLICY "Reviews viewable by everyone"
ON reviews FOR SELECT USING (true);

CREATE POLICY "Students can create reviews"
ON reviews FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Create policies for payments
CREATE POLICY "Users can view own payments"
ON payments FOR SELECT USING (auth.uid() = student_id OR auth.uid() = teacher_id);

-- Create policies for availability
CREATE POLICY "Availability viewable by everyone"
ON availability FOR SELECT USING (true);

CREATE POLICY "Teachers can manage own availability"
ON availability FOR ALL USING (auth.uid() = teacher_id);
