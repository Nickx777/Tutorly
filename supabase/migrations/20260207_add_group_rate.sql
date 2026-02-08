-- Add group_rate to teacher_profiles
ALTER TABLE public.teacher_profiles 
ADD COLUMN IF NOT EXISTS group_rate NUMERIC(10, 2);

-- Add constraint to ensure group_rate is not more than hourly_rate
ALTER TABLE public.teacher_profiles
ADD CONSTRAINT group_rate_not_more_than_hourly_rate 
CHECK (group_rate IS NULL OR group_rate <= hourly_rate);

-- Update RLS to ensure teachers can manage this new field (already covered by existing policies usually, but good to be aware)
COMMENT ON COLUMN public.teacher_profiles.group_rate IS 'Discounted hourly rate for group sessions';
