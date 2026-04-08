
CREATE POLICY "Admins can delete payments"
ON public.payments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete service orders"
ON public.service_orders FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete contact submissions"
ON public.contact_submissions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete user activity"
ON public.user_activity FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
