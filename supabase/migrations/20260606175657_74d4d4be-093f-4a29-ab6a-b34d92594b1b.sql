
-- 1) Move NID into restricted table
CREATE TABLE IF NOT EXISTS public.profile_sensitive (
  user_id uuid PRIMARY KEY,
  nid_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_sensitive TO authenticated;
GRANT ALL ON public.profile_sensitive TO service_role;

ALTER TABLE public.profile_sensitive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sensitive profile"
  ON public.profile_sensitive FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all sensitive profiles"
  ON public.profile_sensitive FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_profile_sensitive_updated_at
  BEFORE UPDATE ON public.profile_sensitive
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data
INSERT INTO public.profile_sensitive (user_id, nid_number)
SELECT user_id, nid_number FROM public.profiles WHERE nid_number IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Remove sensitive column from profiles so the employer SELECT policy no longer exposes it
ALTER TABLE public.profiles DROP COLUMN IF EXISTS nid_number;

-- 2) Restrict anonymous read of companies — drop anon policy, expose safe columns via a view
DROP POLICY IF EXISTS "Companies public read non-sensitive" ON public.companies;

CREATE OR REPLACE VIEW public.companies_public
WITH (security_invoker = true) AS
SELECT id, name, logo_url, location, description, website, phone, is_verified, created_at, updated_at, user_id
FROM public.companies;

GRANT SELECT ON public.companies_public TO anon, authenticated;

-- Re-allow authenticated reads of full row already exists ("Companies readable by authenticated"); anon now must use companies_public.

-- 3) Tighten service_orders SELECT to authenticated only
DROP POLICY IF EXISTS "Users can view own service orders" ON public.service_orders;
CREATE POLICY "Users can view own service orders"
  ON public.service_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4) Prevent client-side spoofing of ip_address
REVOKE INSERT (ip_address) ON public.user_activity FROM authenticated;
REVOKE INSERT (ip_address) ON public.user_activity FROM anon;
