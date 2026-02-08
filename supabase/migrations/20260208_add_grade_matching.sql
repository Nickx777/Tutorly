-- Add grade_level to student_profiles
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS grade_level text;

-- Add target_grades to teacher_profiles
ALTER TABLE teacher_profiles 
ADD COLUMN IF NOT EXISTS target_grades text[];

-- Comment on columns
COMMENT ON COLUMN student_profiles.grade_level IS 'The current grade level of the student (e.g., 10th Grade, University)';
COMMENT ON COLUMN teacher_profiles.target_grades IS 'Array of grades the teacher targets/teaches';
