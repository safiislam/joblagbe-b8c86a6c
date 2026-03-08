
CREATE POLICY "Employers can update applications for their jobs"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE j.id = applications.job_id
      AND c.user_id = auth.uid()
  )
);
