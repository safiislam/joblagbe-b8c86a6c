
-- Add user_id and is_approved to courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Create service_orders table
CREATE TABLE public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  phone text,
  email text,
  service_type text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert service orders" ON public.service_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all service orders" ON public.service_orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own service orders" ON public.service_orders FOR SELECT USING (auth.uid() = user_id);

-- Create contact_submissions table
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  subject text,
  message text NOT NULL,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert contact submissions" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user_activity table
CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all activity" ON public.user_activity FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can insert activity" ON public.user_activity FOR INSERT WITH CHECK (true);

-- Create chat_logs table
CREATE TABLE public.chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert chat logs" ON public.chat_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update chat logs" ON public.chat_logs FOR UPDATE USING (true);
CREATE POLICY "Admins can view all chat logs" ON public.chat_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Update courses RLS: Employers can insert courses (pending approval)
CREATE POLICY "Employers can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Employers can view own courses" ON public.courses FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Update courses: Admins can update (approve)
CREATE POLICY "Admins can update courses" ON public.courses FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete courses" ON public.courses FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can only see approved courses (drop old policy and recreate)
DROP POLICY IF EXISTS "Anyone can read courses" ON public.courses;
CREATE POLICY "Anyone can read approved courses" ON public.courses FOR SELECT USING (is_approved = true);
