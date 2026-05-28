/*
  # Add Rate Limiting System

  1. New Tables
    - `rate_limits`
      - `id` (uuid, primary key) - Unique identifier for each rate limit entry
      - `user_id` (uuid, foreign key) - Reference to the user
      - `endpoint` (text) - API endpoint being rate limited (e.g., 'send-email', 'create-campaign')
      - `request_count` (integer) - Number of requests made in current window
      - `window_start` (timestamptz) - Start time of the current rate limit window
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Indexes
    - Index on `user_id` and `endpoint` for fast lookups
    - Index on `window_start` for cleanup operations

  3. Security
    - Enable RLS on `rate_limits` table
    - Add policy for service role access only (rate limiting is backend-only)

  4. Functions
    - `check_rate_limit` - Checks if user has exceeded rate limit for endpoint
    - `cleanup_old_rate_limits` - Removes rate limit entries older than 1 hour
*/

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can manage rate limits (backend-only)
CREATE POLICY "Service role can manage rate limits"
  ON rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function: Check and update rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_requests integer DEFAULT 100,
  p_window_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count integer;
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_allowed boolean;
BEGIN
  -- Calculate window boundaries
  v_window_end := now();
  v_window_start := v_window_end - (p_window_minutes || ' minutes')::interval;

  -- Get or create rate limit record
  SELECT request_count, window_start
  INTO v_current_count, v_window_start
  FROM rate_limits
  WHERE user_id = p_user_id AND endpoint = p_endpoint;

  -- If no record exists or window has expired, reset
  IF NOT FOUND OR v_window_start < (now() - (p_window_minutes || ' minutes')::interval) THEN
    INSERT INTO rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, now())
    ON CONFLICT (user_id, endpoint)
    DO UPDATE SET
      request_count = 1,
      window_start = now(),
      updated_at = now();
    
    RETURN jsonb_build_object(
      'allowed', true,
      'current_count', 1,
      'limit', p_max_requests,
      'remaining', p_max_requests - 1,
      'reset_at', now() + (p_window_minutes || ' minutes')::interval
    );
  END IF;

  -- Check if limit exceeded
  v_allowed := v_current_count < p_max_requests;

  -- Increment counter if allowed
  IF v_allowed THEN
    UPDATE rate_limits
    SET request_count = request_count + 1,
        updated_at = now()
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
    
    v_current_count := v_current_count + 1;
  END IF;

  -- Return rate limit status
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'current_count', v_current_count,
    'limit', p_max_requests,
    'remaining', GREATEST(0, p_max_requests - v_current_count),
    'reset_at', v_window_start + (p_window_minutes || ' minutes')::interval
  );
END;
$$;

-- Function: Cleanup old rate limit entries (run via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < (now() - interval '2 hours');
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;