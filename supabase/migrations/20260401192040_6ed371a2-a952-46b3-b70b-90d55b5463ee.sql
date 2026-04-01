
-- Fix 2: Drop public SELECT policy on seeker_documents
DROP POLICY IF EXISTS "Anyone can view documents" ON public.seeker_documents;

-- Add policy for employers to view documents of applicants to their jobs
CREATE POLICY "Employers can view applicant documents"
  ON public.seeker_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN companies c ON c.id = j.company_id
      WHERE c.user_id = auth.uid()
        AND a.user_id = seeker_documents.user_id
    )
  );

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
  ON public.seeker_documents FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
