-- Demo Users Setup for Tutorly
-- 
-- STEP 1: First create users in Supabase Dashboard
-- Go to Authentication > Users > Add User
-- Create: demo@teacher.com with password "demo123"
-- Create: demo@student.com with password "demo123"
--
-- STEP 2: The trigger should auto-create entries in public.users
-- If not, run this SQL to create profiles

-- Update the users table entries (in case trigger didn't set role)
UPDATE public.users 
SET role = 'teacher', full_name = 'Demo Teacher'
WHERE email = 'demo@teacher.com';

UPDATE public.users 
SET role = 'student', full_name = 'Demo Student'
WHERE email = 'demo@student.com';

-- Create teacher profile for demo teacher
INSERT INTO public.teacher_profiles (
    user_id,
    bio,
    title,
    subjects,
    hourly_rate,
    years_experience,
    education,
    languages,
    teaching_style,
    auto_accept_bookings,
    created_at,
    updated_at
)
SELECT 
    id,
    'Hi! I''m a demo teacher with expertise in multiple subjects. I love helping students achieve their learning goals through personalized tutoring sessions.',
    'Professional Tutor',
    ARRAY['Mathematics', 'Physics', 'Chemistry'],
    35.00,
    5,
    'Master''s in Education',
    ARRAY['English', 'Spanish'],
    'Interactive and engaging lessons tailored to each student''s learning style.',
    false, -- auto_accept OFF so we can test pending bookings
    now(),
    now()
FROM public.users 
WHERE email = 'demo@teacher.com'
AND NOT EXISTS (
    SELECT 1 FROM public.teacher_profiles tp 
    WHERE tp.user_id = users.id
);

-- Create availability for demo teacher
INSERT INTO public.availability (teacher_id, day_of_week, start_time, end_time, session_type, max_students)
SELECT 
    u.id, day_of_week, start_time, end_time, session_type, max_students
FROM public.users u
CROSS JOIN (VALUES 
    (0, '09:00'::time, '17:00'::time, 'one-on-one', 1),  -- Sunday
    (1, '09:00'::time, '17:00'::time, 'one-on-one', 1),  -- Monday
    (2, '09:00'::time, '17:00'::time, 'one-on-one', 1),  -- Tuesday
    (2, '18:00'::time, '20:00'::time, 'group', 5),       -- Tuesday evening group
    (3, '09:00'::time, '17:00'::time, 'one-on-one', 1),  -- Wednesday
    (4, '09:00'::time, '17:00'::time, 'one-on-one', 1),  -- Thursday
    (4, '18:00'::time, '20:00'::time, 'group', 5),       -- Thursday evening group
    (5, '09:00'::time, '15:00'::time, 'one-on-one', 1),  -- Friday
    (6, '10:00'::time, '14:00'::time, 'one-on-one', 1)   -- Saturday
) AS slots(day_of_week, start_time, end_time, session_type, max_students)
WHERE u.email = 'demo@teacher.com'
AND NOT EXISTS (
    SELECT 1 FROM public.availability a WHERE a.teacher_id = u.id
);

-- Verify setup
SELECT 'Users:' as section;
SELECT id, email, full_name, role FROM public.users WHERE email IN ('demo@teacher.com', 'demo@student.com');

SELECT 'Teacher Profile:' as section;
SELECT tp.id, u.email, tp.title, tp.subjects, tp.hourly_rate, tp.auto_accept_bookings
FROM public.teacher_profiles tp
JOIN public.users u ON tp.user_id = u.id
WHERE u.email = 'demo@teacher.com';

SELECT 'Availability:' as section;
SELECT a.day_of_week, a.start_time, a.end_time, a.session_type, a.max_students
FROM public.availability a
JOIN public.users u ON a.teacher_id = u.id
WHERE u.email = 'demo@teacher.com'
ORDER BY a.day_of_week, a.start_time;
