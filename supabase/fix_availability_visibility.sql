-- FIX: Allow everyone to see availability slots
-- This was missing from previous RLS scripts

DROP POLICY IF EXISTS "Public can view availability" ON public.availability;

CREATE POLICY "Public can view availability" 
ON public.availability FOR SELECT USING (true);

-- Ensure RLS is enabled on availability table (safe measure)
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- Force reload
NOTIFY pgrst, 'reload config';
