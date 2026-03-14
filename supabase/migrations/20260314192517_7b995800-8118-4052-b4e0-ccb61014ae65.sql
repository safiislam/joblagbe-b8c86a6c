
-- Allow admins to update companies (for setting is_verified)
CREATE POLICY "Admins can update companies"
  ON public.companies FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
