
-- Payment settings table for admin to configure payment methods
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method_name text NOT NULL,
  method_type text NOT NULL DEFAULT 'mobile_banking',
  account_number text,
  account_name text,
  instructions text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active payment settings" ON public.payment_settings
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can manage payment settings" ON public.payment_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Payments table to track all payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  payment_type text NOT NULL,
  item_type text NOT NULL,
  item_id text,
  item_title text,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL,
  transaction_id text,
  sender_number text,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert payments" ON public.payments
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Also allow admins to update service_orders status
CREATE POLICY "Admins can update service orders" ON public.service_orders
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
