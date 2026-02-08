-- Quick fix - just create missing columns and policies

-- First ensure lessons table has student_id
ALTER TABLE lessons 
DROP COLUMN IF EXISTS student_id CASCADE;

ALTER TABLE lessons 
ADD COLUMN student_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Ensure reviews has student_id
ALTER TABLE reviews 
DROP COLUMN IF EXISTS student_id CASCADE;

ALTER TABLE reviews 
ADD COLUMN student_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Ensure payments has student_id  
ALTER TABLE payments
DROP COLUMN IF EXISTS student_id CASCADE;

ALTER TABLE payments
ADD COLUMN student_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Recreate policies
DROP POLICY IF EXISTS "Lessons viewable by participants" ON lessons;
DROP POLICY IF EXISTS "Students can book lessons" ON lessons;
DROP POLICY IF EXISTS "Participants can update own lessons" ON lessons;
DROP POLICY IF EXISTS "Students can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;

CREATE POLICY "Lessons viewable by participants"
ON lessons FOR SELECT USING (auth.uid() = teacher_id OR auth.uid() = student_id);

CREATE POLICY "Students can book lessons"
ON lessons FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can update own lessons"
ON lessons FOR UPDATE USING (auth.uid() = teacher_id OR auth.uid() = student_id);

CREATE POLICY "Students can create reviews"
ON reviews FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can view own payments"
ON payments FOR SELECT USING (auth.uid() = student_id OR auth.uid() = teacher_id);
