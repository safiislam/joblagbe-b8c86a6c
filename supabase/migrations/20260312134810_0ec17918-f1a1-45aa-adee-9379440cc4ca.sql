
-- Site content table for CMS
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read site content (public landing page)
CREATE POLICY "Anyone can read site content"
  ON public.site_content FOR SELECT
  TO public
  USING (true);

-- Only admins can manage site content
CREATE POLICY "Admins can manage site content"
  ON public.site_content FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default content for all sections
INSERT INTO public.site_content (section_key, content) VALUES
('announcement', '{"enabled": false, "message": "", "type": "info"}'::jsonb),
('hero', '{"badge": "বাংলাদেশের #১ জব পোর্টাল", "title_line1": "আপনার ক্যারিয়ারের পরবর্তী ধাপ", "title_highlight": "শুরু হোক এখানে", "subtitle": "Thousands of jobs from top employers across Bangladesh. Find your dream career today.", "popular_tags": ["Software Engineer", "Marketing", "Accountant", "Designer", "Data Entry"]}'::jsonb),
('fraud_warning', '{"message": "সতর্কতা: কোনো অর্থের বিনিময়ে চাকরির নিশ্চয়তা দেওয়া হয় না। প্রতারণা থেকে সাবধান থাকুন।"}'::jsonb),
('category_section', '{"title": "ক্যাটাগরি অনুযায়ী খুঁজুন", "subtitle": "Explore opportunities in your field"}'::jsonb),
('quick_links', '{"title": "আপনার জন্য", "subtitle": "Resources to accelerate your career", "items": [{"title": "নিয়োগ বিজ্ঞপ্তি", "desc": "সরকারি-বেসরকারি সকল নিয়োগ বিজ্ঞপ্তি এক জায়গায়।", "icon": "Bell", "color": "bg-primary", "href": "/jobs"}, {"title": "কোর্স সমূহ", "desc": "ক্যারিয়ার গড়তে দরকারি অনলাইন কোর্সসমূহ।", "icon": "BookOpen", "color": "bg-accent", "href": "/courses"}, {"title": "ই-বই", "desc": "চাকরি প্রস্তুতি ও দক্ষতা বৃদ্ধির ই-বই সংগ্রহ।", "icon": "BookMarked", "color": "bg-success", "href": "/ebooks"}, {"title": "ক্যারিয়ার টিপস", "desc": "ইন্টারভিউ, CV এবং ক্যারিয়ার নিয়ে পরামর্শ।", "icon": "Lightbulb", "color": "bg-destructive", "href": "/blog"}]}'::jsonb),
('services', '{"title": "আমাদের সেবাসমূহ", "subtitle": "Services that help you succeed", "items": [{"title": "PROFESSIONAL সিভি তৈরি", "desc": "আমরা পেশাদারভাবে সিভি (CV) তৈরি করে থাকি, যা নিয়োগকর্তার কাছে আপনার দক্ষতা ও যোগ্যতাকে সঠিকভাবে তুলে ধরে।", "icon": "ScrollText", "features": ["আধুনিক ও প্রফেশনাল ডিজাইন", "সঠিক ও গঠনমূলক তথ্য বিন্যাস", "চাকরির ধরন অনুযায়ী কাস্টমাইজেশন", "অভিজ্ঞতা, দক্ষতা ও অর্জনের কার্যকর উপস্থাপন", "Soft copy only"], "cost": "৩০ টাকা / পৃষ্ঠা"}, {"title": "Professional আবেদন", "desc": "আমরা সঠিক ও প্রফেশনালভাবে চাকুরি আবেদন প্রস্তুত করতে সাহায্য করি, যাতে তা নিয়োগকর্তার কাছে প্রভাবশালীভাবে উপস্থাপিত হয়।", "icon": "FileText", "features": ["অভিজ্ঞতা, দক্ষতা ও অর্জনকে কার্যকরভাবে উপস্থাপন", "চাকরির ধরন অনুযায়ী কাস্টমাইজড কনটেন্ট", "পুরো আবেদন প্রক্রিয়ায় সহায়তা", "চাকরি পাওয়ার সম্ভাবনা বাড়াতে লক্ষ্যভিত্তিক কৌশল"], "cost": "৬০-১৩০ টাকা"}, {"title": "Circular বিজ্ঞাপন", "desc": "আপনার প্রতিষ্ঠানের চাকরির বিজ্ঞাপন আমাদের প্ল্যাটফর্মে প্রকাশ করুন এবং লক্ষ্যমাত্রা প্রার্থীদের কাছে দ্রুত পৌঁছে দিন।", "icon": "Megaphone", "features": ["চাকরির বিজ্ঞাপন দ্রুত ও কার্যকরভাবে প্রচারিত", "সঠিক প্রার্থীদের কাছে পৌঁছানো", "ওয়েবসাইট ও সোশ্যাল মিডিয়ায় বিস্তৃত প্রচার"], "cost": "Free (সীমিত সময়)"}]}'::jsonb),
('employer_cta', '{"badge": "For Employers", "title": "Are You Hiring?", "description": "Post your open positions and find the best talent in Bangladesh. Our platform connects you with thousands of job seekers every day.", "button_text": "Post a Job", "features": [{"title": "Post Jobs", "desc": "Reach thousands of qualified candidates", "icon": "Building2"}, {"title": "Manage Applicants", "desc": "Track and filter applications easily", "icon": "Users"}, {"title": "Analytics", "desc": "Insights on your job post performance", "icon": "BarChart3"}]}'::jsonb),
('footer', '{"description": "Bangladesh''s trusted job portal connecting talent with opportunity.", "contact_email": "support@joblagbe.com", "contact_phone": "+880 1XXX-XXXXXX", "social_links": {"facebook": "#", "youtube": "#"}}'::jsonb);
