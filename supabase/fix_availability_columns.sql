-- Add missing columns to availability table for session types and subjects
-- Run this in Supabase SQL Editor

-- Add session_type column (one-on-one or group)
ALTER TABLE availability 
ADD COLUMN IF NOT EXISTS session_type text CHECK (session_type IN ('one-on-one', 'group')) DEFAULT 'one-on-one';

-- Add max_students column for group sessions
ALTER TABLE availability 
ADD COLUMN IF NOT EXISTS max_students integer DEFAULT 1;

-- Add subject column
ALTER TABLE availability 
ADD COLUMN IF NOT EXISTS subject text;

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'availability';
