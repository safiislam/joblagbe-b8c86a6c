DROP POLICY "Approved active jobs viewable by everyone" ON public.jobs;

CREATE POLICY "Approved jobs viewable by everyone"
ON public.jobs
FOR SELECT
TO public
USING (is_approved = true);