
-- Courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  thumbnail_url TEXT,
  link TEXT,
  provider TEXT,
  duration TEXT,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ebooks table
CREATE TABLE public.ebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  cover_image_url TEXT,
  download_url TEXT,
  author TEXT,
  pages INTEGER,
  is_free BOOLEAN NOT NULL DEFAULT true,
  price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Anyone can read ebooks" ON public.ebooks FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage ebooks" ON public.ebooks FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sample courses
INSERT INTO public.courses (title, description, category, provider, duration, is_free) VALUES
('বেসিক কম্পিউটার কোর্স', 'কম্পিউটার ব্যবহারের মৌলিক দক্ষতা শিখুন। MS Office, ইন্টারনেট ব্রাউজিং এবং ইমেইল।', 'কম্পিউটার', 'JobLagbe Academy', '৪ সপ্তাহ', true),
('ওয়েব ডেভেলপমেন্ট ফান্ডামেন্টালস', 'HTML, CSS, JavaScript দিয়ে ওয়েবসাইট তৈরি শিখুন।', 'আইটি', 'JobLagbe Academy', '৮ সপ্তাহ', true),
('গ্রাফিক ডিজাইন মাস্টারক্লাস', 'Adobe Photoshop ও Illustrator দিয়ে প্রফেশনাল ডিজাইন শিখুন।', 'ডিজাইন', 'JobLagbe Academy', '৬ সপ্তাহ', false),
('ডিজিটাল মার্কেটিং', 'SEO, SEM, সোশ্যাল মিডিয়া মার্কেটিং এবং কন্টেন্ট মার্কেটিং শিখুন।', 'মার্কেটিং', 'JobLagbe Academy', '৫ সপ্তাহ', true),
('ইংরেজি ভাষা দক্ষতা', 'চাকরির জন্য প্রয়োজনীয় ইংরেজি কমিউনিকেশন স্কিল।', 'ভাষা', 'JobLagbe Academy', '১০ সপ্তাহ', true),
('অ্যাকাউন্টিং ও ফিন্যান্স', 'বেসিক অ্যাকাউন্টিং, ট্যাক্স এবং ফিন্যান্সিয়াল ম্যানেজমেন্ট।', 'ব্যবসা', 'JobLagbe Academy', '৬ সপ্তাহ', false);

-- Sample ebooks
INSERT INTO public.ebooks (title, description, category, author, pages, is_free) VALUES
('চাকরি প্রস্তুতি গাইড', 'সরকারি ও বেসরকারি চাকরির প্রস্তুতির সম্পূর্ণ গাইডবুক।', 'চাকরি প্রস্তুতি', 'JobLagbe Team', 120, true),
('CV লেখার আধুনিক কৌশল', 'একটি প্রফেশনাল CV তৈরির A to Z গাইড।', 'CV/Resume', 'JobLagbe Team', 45, true),
('ইন্টারভিউ টিপস ও ট্রিকস', 'চাকরির ইন্টারভিউতে সফল হওয়ার কৌশল।', 'ইন্টারভিউ', 'JobLagbe Team', 80, true),
('ফ্রিল্যান্সিং ক্যারিয়ার গাইড', 'ঘরে বসে আয় করার সম্পূর্ণ গাইড।', 'ফ্রিল্যান্সিং', 'JobLagbe Team', 150, false),
('BCS প্রস্তুতি হ্যান্ডনোট', 'BCS পরীক্ষার প্রস্তুতির জন্য সংক্ষিপ্ত নোট।', 'চাকরি প্রস্তুতি', 'JobLagbe Team', 200, true),
('ব্যাংক জব প্রিপারেশন', 'ব্যাংক নিয়োগ পরীক্ষার পূর্ণাঙ্গ প্রস্তুতি গাইড।', 'চাকরি প্রস্তুতি', 'JobLagbe Team', 180, false);
