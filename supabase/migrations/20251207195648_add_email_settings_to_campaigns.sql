/*
  # Add Email Settings to Campaigns

  This migration adds email settings support for professional email formatting.

  ## Changes

  ### `campaigns` Table
  - Add `email_settings` column (jsonb) - Stores email branding and formatting options

  ## Email Settings Schema

  The `email_settings` jsonb field stores:
  - `companyLogoUrl` (string) - URL to company logo
  - `bannerImageUrl` (string) - Optional hero/banner image
  - `companyName` (string) - Company name for header
  - `greeting` (string) - Email greeting text
  - `ctaText` (string) - Call-to-action button text
  - `ctaUrl` (string) - CTA button URL
  - `additionalLinkText` (string) - Optional additional link
  - `additionalLinkUrl` (string) - Additional link URL
  - `facebookUrl` (string) - Facebook profile URL
  - `linkedinUrl` (string) - LinkedIn profile URL
  - `websiteUrl` (string) - Website URL
  - `companyAddress` (string) - Physical address for footer

  ## Notes
  - Default value is empty object '{}'
  - Settings are optional and can be partially filled
  - Used by send-email edge function to format emails
*/

-- Add email_settings column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS email_settings jsonb DEFAULT '{}'::jsonb;

-- Add index for faster queries on email_settings
CREATE INDEX IF NOT EXISTS idx_campaigns_email_settings 
  ON campaigns USING gin (email_settings);

-- Add comment
COMMENT ON COLUMN campaigns.email_settings IS 'Email branding and formatting settings (logo, colors, social links, company info)';
