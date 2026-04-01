
-- Fix 1: Remove public SELECT on video-cvs, add scoped policies
DROP POLICY IF EXISTS "Anyone can view video CVs" ON storage.objects;

CREATE POLICY "Owners can view own video CVs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'video-cvs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Employers can view applicant video CVs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'video-cvs' AND
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      JOIN public.companies c ON c.id = j.company_id
      WHERE c.user_id = auth.uid()
        AND a.user_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Admins can view all video CVs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'video-cvs' AND
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Fix 2: Company logos ownership checks
DROP POLICY IF EXISTS "Users can delete own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload company logos" ON storage.objects;

CREATE POLICY "Users can delete own company logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE id::text = (storage.foldername(name))[1]
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE id::text = (storage.foldername(name))[1]
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload own company logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos' AND
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE id::text = (storage.foldername(name))[1]
        AND user_id = auth.uid()
    )
  );

-- Fix 3: Restrict user_activity inserts
DROP POLICY IF EXISTS "Anyone can insert activity" ON public.user_activity;

CREATE POLICY "Authenticated users can log own activity"
  ON public.user_activity FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
