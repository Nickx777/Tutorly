-- Standalone Fix: Setup Avatar Storage
-- This script ensures the 'avatars' storage bucket exists and has correct permissions.

-- 1. Create the 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read files in the 'avatars' bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. Allow authenticated users to upload files to the 'avatars' bucket
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id = 'avatars'
);

-- 4. Allow users to update and delete their own files in the 'avatars' bucket
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING ( auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'avatars' );

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING ( auth.uid()::text = (storage.foldername(name))[1] AND bucket_id = 'avatars' );
