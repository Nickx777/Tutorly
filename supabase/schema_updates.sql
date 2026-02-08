-- Schema updates for Tutorly platform
-- Run this after final_fix.sql to add missing columns

-- =====================================================
-- Add missing columns to teacher_profiles
-- =====================================================

DO $$
BEGIN
  -- Add location column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'location') THEN
    ALTER TABLE teacher_profiles ADD COLUMN location TEXT;
  END IF;

  -- Add package_rate column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'package_rate') THEN
    ALTER TABLE teacher_profiles ADD COLUMN package_rate INTEGER;
  END IF;

  -- Add timezone column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'timezone') THEN
    ALTER TABLE teacher_profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;

  -- Add title column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'title') THEN
    ALTER TABLE teacher_profiles ADD COLUMN title TEXT;
  END IF;

  -- Add website column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'website') THEN
    ALTER TABLE teacher_profiles ADD COLUMN website TEXT;
  END IF;

  -- Add auto_accept_bookings column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'auto_accept_bookings') THEN
    ALTER TABLE teacher_profiles ADD COLUMN auto_accept_bookings BOOLEAN DEFAULT true;
  END IF;

  -- Add photo_url column (for avatar/photo storage)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'photo_url') THEN
    ALTER TABLE teacher_profiles ADD COLUMN photo_url TEXT;
  END IF;
END $$;

-- =====================================================
-- Add missing columns to users table
-- =====================================================

DO $$
BEGIN
  -- Add suspended column for admin control
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'suspended') THEN
    ALTER TABLE users ADD COLUMN suspended BOOLEAN DEFAULT false;
  END IF;

  -- Add suspended_at timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'suspended_at') THEN
    ALTER TABLE users ADD COLUMN suspended_at TIMESTAMPTZ;
  END IF;
END $$;

-- =====================================================
-- Update lessons table to match app requirements
-- =====================================================

DO $$
BEGIN
  -- Add title column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'title') THEN
    ALTER TABLE lessons ADD COLUMN title TEXT;
  END IF;

  -- Add price column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'price') THEN
    ALTER TABLE lessons ADD COLUMN price INTEGER DEFAULT 0;
  END IF;

  -- Add notes column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'notes') THEN
    ALTER TABLE lessons ADD COLUMN notes TEXT;
  END IF;

  -- Add lesson_type column (one_on_one or group)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'lesson_type') THEN
    ALTER TABLE lessons ADD COLUMN lesson_type TEXT DEFAULT 'one_on_one' CHECK (lesson_type IN ('one_on_one', 'group'));
  END IF;
END $$;

-- =====================================================
-- Update reviews table
-- =====================================================

DO $$
BEGIN
  -- Add approved column for moderation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'approved') THEN
    ALTER TABLE reviews ADD COLUMN approved BOOLEAN DEFAULT true;
  END IF;

  -- Add subject column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'subject') THEN
    ALTER TABLE reviews ADD COLUMN subject TEXT;
  END IF;

  -- Add helpful_count column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'helpful_count') THEN
    ALTER TABLE reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- Create storage bucket for avatars (run in Supabase dashboard)
-- =====================================================
-- Note: Run this SQL in the Supabase SQL Editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- =====================================================
-- Create indexes for better query performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_lessons_scheduled_at ON lessons(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_reviews_teacher_id ON reviews(teacher_id);
CREATE INDEX IF NOT EXISTS idx_availability_teacher_id ON availability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payments_teacher_id ON payments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- Create view for teacher stats (for dashboard)
-- =====================================================

CREATE OR REPLACE VIEW teacher_stats_view AS
SELECT 
  tp.user_id as teacher_id,
  u.full_name,
  u.email,
  tp.hourly_rate,
  tp.approved,
  COALESCE(lesson_stats.total_lessons, 0) as total_lessons,
  COALESCE(lesson_stats.total_students, 0) as total_students,
  COALESCE(lesson_stats.upcoming_lessons, 0) as upcoming_lessons,
  COALESCE(review_stats.avg_rating, 0) as average_rating,
  COALESCE(review_stats.total_reviews, 0) as total_reviews,
  COALESCE(payment_stats.total_earnings, 0) as total_earnings,
  COALESCE(payment_stats.pending_earnings, 0) as pending_earnings
FROM teacher_profiles tp
JOIN users u ON tp.user_id = u.id
LEFT JOIN (
  SELECT 
    teacher_id,
    COUNT(*) as total_lessons,
    COUNT(DISTINCT student_id) as total_students,
    COUNT(*) FILTER (WHERE status = 'scheduled' AND scheduled_at > NOW()) as upcoming_lessons
  FROM lessons
  GROUP BY teacher_id
) lesson_stats ON tp.user_id = lesson_stats.teacher_id
LEFT JOIN (
  SELECT 
    teacher_id,
    AVG(rating)::NUMERIC(2,1) as avg_rating,
    COUNT(*) as total_reviews
  FROM reviews
  WHERE approved = true
  GROUP BY teacher_id
) review_stats ON tp.user_id = review_stats.teacher_id
LEFT JOIN (
  SELECT 
    teacher_id,
    SUM(teacher_payout) FILTER (WHERE status = 'completed') as total_earnings,
    SUM(teacher_payout) FILTER (WHERE status = 'pending') as pending_earnings
  FROM payments
  GROUP BY teacher_id
) payment_stats ON tp.user_id = payment_stats.teacher_id;
