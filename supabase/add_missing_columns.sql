    -- Schema Update: Add missing columns expected by the application
    -- Run this in your Supabase SQL Editor

    -- =====================================================
    -- LESSONS TABLE - Add missing columns
    -- =====================================================

    -- Add price column if missing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'price') THEN
        ALTER TABLE lessons ADD COLUMN price integer DEFAULT 0;
    END IF;
    END $$;

    -- Add lesson_type column if missing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'lesson_type') THEN
        ALTER TABLE lessons ADD COLUMN lesson_type text DEFAULT 'one_on_one';
    END IF;
    END $$;

    -- Add notes column if missing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'notes') THEN
        ALTER TABLE lessons ADD COLUMN notes text;
    END IF;
    END $$;

    -- =====================================================
    -- REVIEWS TABLE - Add missing columns
    -- =====================================================

    -- Add approved column if missing (required for review moderation)
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'approved') THEN
        ALTER TABLE reviews ADD COLUMN approved boolean DEFAULT true;
    END IF;
    END $$;

    -- Add subject column if missing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'subject') THEN
        ALTER TABLE reviews ADD COLUMN subject text;
    END IF;
    END $$;

    -- =====================================================
    -- TEACHER_PROFILES TABLE - Add missing columns
    -- =====================================================

    -- Add title column if missing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'title') THEN
        ALTER TABLE teacher_profiles ADD COLUMN title text;
    END IF;
    END $$;

    -- Add location column if missing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'location') THEN
        ALTER TABLE teacher_profiles ADD COLUMN location text;
    END IF;
    END $$;

    -- Add website column if missing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'website') THEN
        ALTER TABLE teacher_profiles ADD COLUMN website text;
    END IF;
    END $$;

    -- Add photo_url column if missing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'photo_url') THEN
        ALTER TABLE teacher_profiles ADD COLUMN photo_url text;
    END IF;
    END $$;

    -- Add timezone column if missing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'timezone') THEN
        ALTER TABLE teacher_profiles ADD COLUMN timezone text DEFAULT 'UTC';
    END IF;
    END $$;

    -- Add package_rate column if missing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'package_rate') THEN
        ALTER TABLE teacher_profiles ADD COLUMN package_rate integer;
    END IF;
    END $$;

    -- Add auto_accept_bookings column if m issing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'auto_accept_bookings') THEN
        ALTER TABLE teacher_profiles ADD COLUMN auto_accept_bookings boolean DEFAULT false;
    END IF;
    END $$;

    -- Add updated_at column if missing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE teacher_profiles ADD COLUMN updated_at timestamptz;
    END IF;
    END $$;

    -- =====================================================
    -- USERS TABLE - Add missing columns
    -- =====================================================

    -- Add suspended column if missing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'suspended') THEN
        ALTER TABLE users ADD COLUMN suspended boolean DEFAULT false;
    END IF;
    END $$;

    -- Add suspended_at column if missing
    DO $$
    BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'suspended_at') THEN
        ALTER TABLE users ADD COLUMN suspended_at timestamptz;
    END IF;
    END $$;

    -- =====================================================
    -- Done! Run SELECT statements to verify
    -- =====================================================
    
-- =====================================================
-- AVAILABILITY TABLE - Add missing columns
-- =====================================================

-- Add session_type column if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'availability' AND column_name = 'session_type') THEN
    ALTER TABLE availability ADD COLUMN session_type text DEFAULT 'one-on-one';
  END IF;
END $$;

-- Add max_students column if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'availability' AND column_name = 'max_students') THEN
    ALTER TABLE availability ADD COLUMN max_students integer DEFAULT 1;
  END IF;
END $$;

SELECT 'Schema update complete!' as status;
