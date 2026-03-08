
-- Add approval status to jobs
ALTER TABLE public.jobs ADD COLUMN is_approved boolean NOT NULL DEFAULT false;

-- Update RLS: public can only see approved AND active jobs
DROP POLICY IF EXISTS "Active jobs viewable by everyone" ON public.jobs;
CREATE POLICY "Approved active jobs viewable by everyone"
ON public.jobs FOR SELECT
USING (is_active = true AND is_approved = true);

-- Admin can see all jobs (for approval)
CREATE POLICY "Admins can view all jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update any job (approve/reject)
CREATE POLICY "Admins can update any job"
ON public.jobs FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Company owners can view their own jobs regardless of approval
CREATE POLICY "Owners can view own jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM companies WHERE companies.id = jobs.company_id AND companies.user_id = auth.uid()
));
