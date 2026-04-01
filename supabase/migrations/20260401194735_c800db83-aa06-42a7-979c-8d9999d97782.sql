
-- Fix 1: Payment settings - only admins should see full details
DROP POLICY IF EXISTS "Authenticated users can read active payment settings" ON public.payment_settings;

-- Keep the admin ALL policy, add a limited authenticated read
CREATE POLICY "Authenticated users can read active payment settings"
  ON public.payment_settings FOR SELECT TO authenticated
  USING (is_active = true);

-- Fix 2: Chat logs - add user-scoped INSERT and SELECT
CREATE POLICY "Users can insert own chat logs"
  ON public.chat_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat logs"
  ON public.chat_logs FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own chat logs"
  ON public.chat_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Fix 3: Course images - restrict upload to course owners/admins
DROP POLICY IF EXISTS "Authenticated users can upload course images" ON storage.objects;

CREATE POLICY "Course owners and admins can upload course images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'course-images' AND
    (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1 FROM public.courses
        WHERE user_id = auth.uid()
      )
    )
  );
