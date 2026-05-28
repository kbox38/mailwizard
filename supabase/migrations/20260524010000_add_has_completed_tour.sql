-- Add onboarding-tour tracking to profiles.
--
-- The frontend `useTour` hook reads/writes `has_completed_tour` to decide whether
-- to show the product tour. It was previously querying a non-existent
-- `user_profiles` table (404s in the console); the hook now targets `profiles`,
-- which needs this column.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS has_completed_tour boolean NOT NULL DEFAULT false;

-- Existing accounts have already been using the app, so don't push them back
-- through onboarding. New signups get the default (false) and see the tour once.
UPDATE profiles SET has_completed_tour = true WHERE has_completed_tour = false;
