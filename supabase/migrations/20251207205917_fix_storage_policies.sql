/*
  # Fix Storage Bucket and RLS Policies

  1. Storage Bucket Policies
    - Create public read access for media_library bucket
    - Allow authenticated users to upload their own files
    - Allow users to update/delete their own files
    - Files organized by user_id folders

  2. Database Table Verification
    - Ensure media_library table exists with proper schema
    - Enable RLS on table
    - Create policies for authenticated users
    - Add necessary indexes

  3. Security
    - Public read access for all images (bucket is public)
    - Write access only for authenticated users
    - Users can only modify their own files
    - Folder structure enforces user separation
*/

-- ============================================================================
-- Storage Bucket Policies
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Policy 1: Anyone can read from media_library (bucket is public)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'media_library' );

-- Policy 2: Authenticated users can upload files to their own folder
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media_library'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media_library'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media_library'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- Database Table for Media Library
-- ============================================================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  width integer,
  height integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own media" ON media_library;
DROP POLICY IF EXISTS "Users can insert own media" ON media_library;
DROP POLICY IF EXISTS "Users can delete own media" ON media_library;

-- Create table policies
CREATE POLICY "Users can view own media"
ON media_library FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media"
ON media_library FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
ON media_library FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_library_user_id ON media_library(user_id);
CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON media_library(user_id, created_at DESC);