CREATE POLICY "Admins can read all OTPs"
ON public.phone_otps
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));