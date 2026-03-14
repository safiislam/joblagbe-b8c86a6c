
-- Add is_verified to companies
ALTER TABLE public.companies ADD COLUMN is_verified boolean NOT NULL DEFAULT false;

-- Create verification requests table
CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Owners can insert their own requests
CREATE POLICY "Owners can request verification"
  ON public.verification_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owners can view own requests
CREATE POLICY "Owners can view own requests"
  ON public.verification_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all requests
CREATE POLICY "Admins can manage verification requests"
  ON public.verification_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
