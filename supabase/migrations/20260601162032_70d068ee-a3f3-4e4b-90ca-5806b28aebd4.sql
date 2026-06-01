
-- 1. Circular images: enforce folder/company ownership on INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Authenticated users can upload circular images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own circular images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own circular images" ON storage.objects;

CREATE POLICY "Employers can upload circular images for own company"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'circular-images'
  AND EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id::text = (storage.foldername(storage.objects.name))[1]
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Employers can update own circular images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'circular-images'
  AND EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id::text = (storage.foldername(storage.objects.name))[1]
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Employers can delete own circular images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'circular-images'
  AND EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id::text = (storage.foldername(storage.objects.name))[1]
      AND c.user_id = auth.uid()
  )
);

-- 2. Hide company phone numbers from anonymous users (column-level grant)
REVOKE SELECT ON public.companies FROM anon;
GRANT SELECT (
  id, user_id, name, logo_url, description, website,
  location, is_verified, trade_license, created_at, updated_at
) ON public.companies TO anon;

-- 3. Realtime: only allow users to subscribe to their own notification topic
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to own notification topic" ON realtime.messages;
CREATE POLICY "Users can subscribe to own notification topic"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() = ('notifications:' || auth.uid()::text)
  OR realtime.topic() NOT LIKE 'notifications:%'
);
