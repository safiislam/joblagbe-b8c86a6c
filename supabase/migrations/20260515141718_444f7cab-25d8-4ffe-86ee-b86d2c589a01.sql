
DROP POLICY IF EXISTS "Users can upload own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own company logos" ON storage.objects;

CREATE POLICY "Users can upload own company logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id::text = (storage.foldername(storage.objects.name))[1]
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own company logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id::text = (storage.foldername(storage.objects.name))[1]
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own company logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id::text = (storage.foldername(storage.objects.name))[1]
      AND c.user_id = auth.uid()
  )
);
