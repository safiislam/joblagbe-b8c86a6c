CREATE OR REPLACE FUNCTION public.get_categories_with_count()
RETURNS TABLE (
  id uuid,
  name text,
  icon text,
  created_at timestamptz,
  job_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.icon,
    c.created_at,
    COUNT(j.id) AS job_count
  FROM categories c
  LEFT JOIN jobs j
    ON j.category_id = c.id
    AND j.is_active = true
    AND j.is_approved = true
  GROUP BY c.id, c.name, c.icon, c.created_at
  ORDER BY c.name;
$$;