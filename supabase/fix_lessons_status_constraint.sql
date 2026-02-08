-- Fix limits on 'status' column in 'lessons' table
-- The 'bookings' API needs to insert 'pending' for lessons that require approval.
-- The current constraint likely restricts this to ('scheduled', 'completed', 'cancelled').

ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_status_check;

ALTER TABLE public.lessons ADD CONSTRAINT lessons_status_check
CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled', 'full'));

-- Also ensure the column default is correct if needed, though 'scheduled' is fine.
