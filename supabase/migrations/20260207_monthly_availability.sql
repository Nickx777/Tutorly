-- Create date_availability table for specific dates
CREATE TABLE IF NOT EXISTS public.date_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    lesson_type VARCHAR(20) DEFAULT 'one_on_one' CHECK (lesson_type IN ('one_on_one', 'group')),
    max_students INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Prevent overlapping slots for the same teacher on the same date
    CONSTRAINT no_overlapping_slots EXCLUDE USING gist (
        teacher_id WITH =,
        available_date WITH =,
        tsrange(
            (available_date + start_time),
            (available_date + end_time)
        ) WITH &&
    )
);

-- Note: The above EXCLUDE constraint requires btree_gist extension
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- RLS Policies
ALTER TABLE public.date_availability ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own availability
CREATE POLICY "Teachers can manage their own date availability"
ON public.date_availability
FOR ALL
USING (teacher_id IN (
    SELECT id FROM public.teacher_profiles WHERE user_id = auth.uid()
));

-- Students can view all (approved) teacher availability
CREATE POLICY "Students can view date availability"
ON public.date_availability
FOR SELECT
USING (true);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_date_availability_updated_at
BEFORE UPDATE ON public.date_availability
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
