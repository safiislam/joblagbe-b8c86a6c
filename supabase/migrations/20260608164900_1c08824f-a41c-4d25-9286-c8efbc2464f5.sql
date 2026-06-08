
DROP POLICY IF EXISTS "Companies readable by authenticated" ON public.companies;

CREATE POLICY "Owners can view own company"
ON public.companies FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all companies"
ON public.companies FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Storage UPDATE policies for private buckets (owner-scoped to first folder = user_id)
CREATE POLICY "Users can update own resumes"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own video CVs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'video-cvs' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'video-cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
