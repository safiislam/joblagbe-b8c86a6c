-- Create storage bucket for site assets (logo, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read site assets
CREATE POLICY "Anyone can read site assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Allow admins to upload site assets
CREATE POLICY "Admins can manage site assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-assets' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-assets' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-assets' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);