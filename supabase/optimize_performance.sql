-- Optimize Database Performance with Indexes

-- 1. Index foreign keys for faster joins and lookups
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student_id ON lessons(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_teacher_id ON bookings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_teacher_id ON reviews(teacher_id);
CREATE INDEX IF NOT EXISTS idx_availability_teacher_id ON availability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON teacher_profiles(user_id);

-- 2. Index filtering columns
CREATE INDEX IF NOT EXISTS idx_lessons_scheduled_at ON lessons(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- 3. Optimization for availability checks (composite index)
--    Helps finding lessons in a time range for a specific teacher
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_time ON lessons(teacher_id, scheduled_at);

-- Force statistics update
ANALYZE lessons;
ANALYZE reviews;
ANALYZE availability;
