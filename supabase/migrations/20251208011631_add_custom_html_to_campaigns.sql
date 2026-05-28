/*
  # Add Custom HTML Support to Campaigns

  1. New Columns
    - `custom_html` (text, nullable) - Stores custom HTML code when users paste their own HTML instead of using templates
  
  2. Changes
    - Add custom_html column to campaigns table
    - This allows campaigns to be created via two paths: template selection OR custom HTML paste
  
  3. Notes
    - Column is nullable because not all campaigns will use custom HTML
    - When custom_html is set, template_id may be null (and vice versa)
    - Either custom_html OR template_id should be populated, but not both
*/

-- Add custom_html column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS custom_html TEXT;

-- Add a check to ensure either template_id or custom_html is provided (but not both required)
-- This is a soft validation - the application will enforce the business logic