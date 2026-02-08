-- CRITICAL SCHEMA FIX: Align 'lessons' table with App Code
-- The Application code treats 'lessons' as the Bookings table.
-- The original Schema defined 'lessons' as "Service Types" (like a menu).
-- We must add the missing columns to 'lessons' so it can store Bookings.

ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'full', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS lesson_type TEXT DEFAULT 'one_on_one';

-- Ensure indexes exist for these new columns for performance
CREATE INDEX IF NOT EXISTS idx_lessons_scheduled_at ON public.lessons(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON public.lessons(student_id);

-- Backfill 'subject' from 'title' if it exists and subject is empty
UPDATE public.lessons SET subject = title WHERE subject IS NULL AND title IS NOT NULL;

-- Make sure RLS policies cover the new columns
-- (The previously applied permissive policies should handle this, but force reload to be safe)
NOTIFY pgrst, 'reload config';
