
-- Storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Storage RLS: users can upload their own resumes
CREATE POLICY "Users can upload own resume" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own resume" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own resume" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins can view all resumes" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Employers can view applicant resumes" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'resumes');

-- Add resume_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_url text;

-- Blog posts table
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  cover_image_url text,
  author_name text NOT NULL DEFAULT 'Job Lagbe Team',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published blogs viewable by everyone" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage blogs" ON public.blog_posts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Saved jobs / bookmarks
CREATE TABLE public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saved jobs" ON public.saved_jobs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger for blog updated_at
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
