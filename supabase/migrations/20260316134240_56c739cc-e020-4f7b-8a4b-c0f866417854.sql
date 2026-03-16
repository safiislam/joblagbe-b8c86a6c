CREATE POLICY "Admins can delete chat logs"
ON public.chat_logs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));