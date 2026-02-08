-- FINAL COMPATIBILITY FIX: Relax 'title' constraint
-- The 'lessons' table requires a 'title', but our App uses 'subject'.
-- We will make 'title' optional (NULL).

ALTER TABLE public.lessons ALTER COLUMN title DROP NOT NULL;

-- Optional: Copy 'subject' into 'title' for any existing rows that might need it
UPDATE public.lessons SET title = subject WHERE title IS NULL;

-- Force reload
NOTIFY pgrst, 'reload config';
