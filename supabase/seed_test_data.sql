-- SEED TEST DATA: Add Availability for ALL Teachers on ALL Days
-- This ensures you can verify the Booking UI without hunting for specific days.

INSERT INTO public.availability (teacher_id, day_of_week, start_time, end_time)
SELECT 
  u.id, 
  day_num, 
  '09:00:00', 
  '17:00:00'
FROM public.users u
CROSS JOIN generate_series(0, 6) as day_num
WHERE u.role = 'teacher'
-- Only insert if no slot exists for this day/teacher to avoid duplicates
AND NOT EXISTS (
  SELECT 1 FROM public.availability a 
  WHERE a.teacher_id = u.id AND a.day_of_week = day_num
);

-- Output confirmation
DO $$ BEGIN RAISE NOTICE 'Test availability slots added for all teachers.'; END $$;
