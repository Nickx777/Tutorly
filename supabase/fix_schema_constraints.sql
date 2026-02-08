-- Fix Schema Constraints to align with codebase (User ID vs Profile ID)

-- 1. AVAILABILITY: Fix teacher_id to reference users(id)
DO $$ BEGIN
    ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_teacher_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE availability 
  ADD CONSTRAINT availability_teacher_id_fkey 
  FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- 2. LESSONS: Fix teacher_id to reference users(id)
DO $$ BEGIN
    ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_teacher_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE lessons 
  ADD CONSTRAINT lessons_teacher_id_fkey 
  FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- 3. REVIEWS: Fix teacher_id to reference users(id)
DO $$ BEGIN
    ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_teacher_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE reviews 
  ADD CONSTRAINT reviews_teacher_id_fkey 
  FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- 4. BOOKINGS: Fix teacher_id to reference users(id)
DO $$ BEGIN
    ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_teacher_id_fkey;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE bookings 
  ADD CONSTRAINT bookings_teacher_id_fkey 
  FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- 5. Force Schema Cache Reload
NOTIFY pgrst, 'reload config';
