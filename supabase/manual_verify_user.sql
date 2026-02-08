-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO MANUALLY VERIFY A USER
-- This bypasses the email requirement so you can log in immediately.

-- 1. Replace 'YOUR_EMAIL_HERE' with the email you signed up with (e.g., 'test@example.com')
UPDATE auth.users
SET email_confirmed_at = now(),
    updated_at = now()
WHERE email = 'YOUR_EMAIL_HERE';

-- 2. Verify the update worked
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';
