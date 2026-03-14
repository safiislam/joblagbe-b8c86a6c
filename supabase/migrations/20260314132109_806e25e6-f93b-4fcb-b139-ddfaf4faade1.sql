-- Create company-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-logos');

-- Allow anyone to view logos
CREATE POLICY "Anyone can view company logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'company-logos');

-- Allow users to update their own logos
CREATE POLICY "Users can update own company logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-logos');

-- Allow users to delete their own logos
CREATE POLICY "Users can delete own company logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company-logos');