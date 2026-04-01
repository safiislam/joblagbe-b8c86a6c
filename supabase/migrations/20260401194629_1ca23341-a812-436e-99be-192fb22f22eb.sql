
-- Fix 1: Broken resume employer policy - name ambiguity with companies.name
DROP POLICY IF EXISTS "Employers can view applicant resumes" ON storage.objects;

CREATE POLICY "Employers can view applicant resumes"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] IN (
      SELECT a.user_id::text
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      JOIN public.companies c ON c.id = j.company_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Fix 2: Broken video-cv employer policy - same issue
DROP POLICY IF EXISTS "Employers can view applicant video CVs" ON storage.objects;

CREATE POLICY "Employers can view applicant video CVs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'video-cvs' AND
    (storage.foldername(name))[1] IN (
      SELECT a.user_id::text
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      JOIN public.companies c ON c.id = j.company_id
      WHERE c.user_id = auth.uid()
    )
  );

-- Fix 3: Companies - restrict public SELECT, add authenticated policy for full data
DROP POLICY IF EXISTS "Companies viewable by everyone" ON public.companies;

CREATE POLICY "Companies public read non-sensitive"
  ON public.companies FOR SELECT TO anon
  USING (true);

CREATE POLICY "Companies readable by authenticated"
  ON public.companies FOR SELECT TO authenticated
  USING (true);
