
CREATE TABLE public.phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage OTPs"
ON public.phone_otps
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX idx_phone_otps_phone_code ON public.phone_otps (phone, otp_code);
