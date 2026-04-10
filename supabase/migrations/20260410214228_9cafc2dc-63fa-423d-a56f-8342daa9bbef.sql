
-- Add post_type and circular_image_url to jobs table
ALTER TABLE public.jobs 
ADD COLUMN post_type text NOT NULL DEFAULT 'regular',
ADD COLUMN circular_image_url text NULL;

-- Create storage bucket for circular images
INSERT INTO storage.buckets (id, name, public) VALUES ('circular-images', 'circular-images', true);

-- Storage policies for circular images
CREATE POLICY "Circular images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'circular-images');

CREATE POLICY "Authenticated users can upload circular images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'circular-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own circular images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'circular-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own circular images"
ON storage.objects FOR DELETE
USING (bucket_id = 'circular-images' AND auth.role() = 'authenticated');
