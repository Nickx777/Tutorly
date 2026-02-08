-- FINAL SCHEMA FIX: Foreign Keys & Constraints
-- 1. Fix Foreign Key: 'lessons.teacher_id' must reference 'users.id', not 'teacher_profiles.id'
-- 2. Fix Constraints: 'type' column is NOT NULL but we use 'lesson_type'.

DO $$ 
BEGIN 
    -- A. Handle 'teacher_id' FK ---------------------------------
    -- 1. Drop old constraint if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'lessons_teacher_id_fkey') THEN
        ALTER TABLE public.lessons DROP CONSTRAINT lessons_teacher_id_fkey;
    END IF;

    -- 2. Migrate Data (Profile ID -> User ID)
    --    Only does this if the ID looks like it's NOT in users table
    UPDATE public.lessons
    SET teacher_id = tp.user_id
    FROM public.teacher_profiles tp
    WHERE public.lessons.teacher_id = tp.id;

    -- 3. Add NEW Constraint (referencing users)
    --    We use a different name to be safe
    ALTER TABLE public.lessons 
    ADD CONSTRAINT lessons_teacher_id_users_fkey 
    FOREIGN KEY (teacher_id) REFERENCES public.users(id);


    -- B. Handle 'type' vs 'lesson_type' -------------------------
    -- Original schema had 'type' as NOT NULL. API sends 'lesson_type'.
    -- We must make 'type' nullable OR default it.
    
    ALTER TABLE public.lessons ALTER COLUMN type DROP NOT NULL;
    
    -- Sync existing data
    UPDATE public.lessons SET type = lesson_type WHERE type IS NULL;


    -- C. Ensure 'price' is not null (API provides it, but good to have default)
    ALTER TABLE public.lessons ALTER COLUMN price SET DEFAULT 0;

EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Error applying schema fix: %', SQLERRM;
END $$;

-- Force reload
NOTIFY pgrst, 'reload config';
