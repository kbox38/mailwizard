/*
  # Media Library Tracking Table

  1. New Table
    - `media_library` - Tracks uploaded images for templates
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `filename` (text) - Original filename
      - `storage_path` (text) - Path in Supabase Storage
      - `public_url` (text) - CDN URL for the image
      - `file_size` (integer) - File size in bytes
      - `mime_type` (text) - MIME type
      - `width` (integer) - Image width in pixels
      - `height` (integer) - Image height in pixels
      - `created_at` (timestamptz) - Upload timestamp

  2. Security
    - Enable RLS on media_library table
    - Users can only view/insert/delete their own media
    - Proper indexing for performance

  3. Notes
    - Storage bucket 'media_library' must be created in Supabase dashboard
    - Bucket should be public with 5MB file size limit
    - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
*/

-- Create table to track uploaded media
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

-- Enable RLS on media_library table
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own media
CREATE POLICY "Users can view own media"
ON media_library
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own media
CREATE POLICY "Users can insert own media"
ON media_library
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own media
CREATE POLICY "Users can delete own media"
ON media_library
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_media_library_user_id 
ON media_library(user_id);

CREATE INDEX IF NOT EXISTS idx_media_library_created_at 
ON media_library(user_id, created_at DESC);