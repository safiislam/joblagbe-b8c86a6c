CREATE POLICY "Authenticated users can upload course images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "Anyone can view course images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'course-images');