CREATE POLICY "Admins can delete jobs"
ON public.jobs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));