
-- Allow admins to delete payment settings (covered by ALL policy already)
-- Allow admins to read all payment settings (not just active ones)
CREATE POLICY "Admins can read all payment settings" ON public.payment_settings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
