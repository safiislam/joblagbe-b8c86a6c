DROP VIEW IF EXISTS public.companies_public;

CREATE VIEW public.companies_public
WITH (security_invoker = true) AS
SELECT id, name, logo_url, location, description, website, phone, is_verified, created_at, updated_at
FROM public.companies;

GRANT SELECT ON public.companies_public TO anon, authenticated;
GRANT SELECT (id, name, logo_url, location, description, website, phone, is_verified, created_at, updated_at) ON public.companies TO anon;

DROP POLICY IF EXISTS "Public can view safe company fields" ON public.companies;
CREATE POLICY "Public can view safe company fields"
  ON public.companies
  FOR SELECT
  TO anon
  USING (true);