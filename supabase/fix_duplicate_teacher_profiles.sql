-- Fix Duplicate Teacher Profiles

-- 1. Delete duplicate profiles, keeping only the most recently updated/created one.
WITH duplicates AS (
    SELECT
        id,
        user_id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY updated_at DESC NULLS LAST, created_at DESC
        ) as row_num
    FROM
        public.teacher_profiles
)
DELETE FROM
    public.teacher_profiles
WHERE
    id IN (
        SELECT id
        FROM duplicates
        WHERE row_num > 1
    );

-- 2. Add a UNIQUE constraint to user_id to prevent duplicates in the future.
-- We use a DO block to avoid errors if the constraint already exists.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'teacher_profiles_user_id_key'
    ) THEN
        ALTER TABLE public.teacher_profiles
        ADD CONSTRAINT teacher_profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 3. Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload config';
