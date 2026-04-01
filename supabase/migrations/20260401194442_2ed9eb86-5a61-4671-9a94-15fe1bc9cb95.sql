
-- Fix 1: Resume storage - replace overly permissive employer policy with scoped one
DROP POLICY IF EXISTS "Employers can view applicant resumes" ON storage.objects;

CREATE POLICY "Employers can view applicant resumes"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      JOIN public.companies c ON c.id = j.company_id
      WHERE c.user_id = auth.uid()
        AND a.user_id::text = (storage.foldername(name))[1]
    )
  );

-- Fix 2: Profiles - restrict public SELECT to non-sensitive fields via view approach
-- Instead, restrict so only authenticated users see full profiles, public sees limited
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Employers can view applicant profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      JOIN public.companies c ON c.id = j.company_id
      WHERE c.user_id = auth.uid()
        AND a.user_id = profiles.user_id
    )
  );

-- Fix 3: Payment settings - restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can read active payment settings" ON public.payment_settings;

CREATE POLICY "Authenticated users can read active payment settings"
  ON public.payment_settings FOR SELECT TO authenticated
  USING (is_active = true);

-- Fix 4: User roles - restrict so users can only see own roles (+ admin sees all)
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
