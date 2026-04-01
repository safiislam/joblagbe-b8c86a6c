
-- Fix notifications: triggers use SECURITY DEFINER so bypass RLS
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Fix payments: require auth and user ownership
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
CREATE POLICY "Authenticated users can insert own payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix service_orders: require auth and user ownership
DROP POLICY IF EXISTS "Anyone can insert service orders" ON public.service_orders;
CREATE POLICY "Authenticated users can insert own service orders"
  ON public.service_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
