
-- Rate limiting function that checks user_activity table for recent actions
-- Returns true if the user is within the allowed limit, false if rate limited
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier text,
  _action text,
  _max_count integer,
  _interval_minutes integer
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT (
    SELECT COUNT(*)
    FROM public.user_activity
    WHERE (
      (user_id IS NOT NULL AND user_id::text = _identifier)
      OR (user_id IS NULL AND ip_address = _identifier)
    )
    AND action = _action
    AND created_at > (now() - (_interval_minutes || ' minutes')::interval)
  ) < _max_count
$$;
