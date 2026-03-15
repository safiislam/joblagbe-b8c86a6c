
-- Create popup_banners table
CREATE TABLE public.popup_banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  image_url text,
  cta_text text DEFAULT 'বিস্তারিত দেখুন',
  cta_link text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.popup_banners ENABLE ROW LEVEL SECURITY;

-- Anyone can read active banners
CREATE POLICY "Anyone can read active popup banners"
  ON public.popup_banners FOR SELECT
  TO public
  USING (is_active = true);

-- Admins can manage all popup banners
CREATE POLICY "Admins can manage popup banners"
  ON public.popup_banners FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for popup images
INSERT INTO storage.buckets (id, name, public) VALUES ('popup-banners', 'popup-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read on popup banner images
CREATE POLICY "Public read popup banners" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'popup-banners');

-- Allow admins to upload popup banner images
CREATE POLICY "Admins upload popup banners" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'popup-banners' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete popup banner images
CREATE POLICY "Admins delete popup banners" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'popup-banners' AND has_role(auth.uid(), 'admin'::app_role));
