
CREATE TABLE public.seeker_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL DEFAULT 'resume',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seeker_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.seeker_documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.seeker_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.seeker_documents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view documents" ON public.seeker_documents
  FOR SELECT USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('video-cvs', 'video-cvs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload video CVs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'video-cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view video CVs"
ON storage.objects FOR SELECT USING (bucket_id = 'video-cvs');

CREATE POLICY "Users can delete own video CVs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'video-cvs' AND (storage.foldername(name))[1] = auth.uid()::text);
