
-- Allow null user_id on companies for seed/demo data
ALTER TABLE public.companies ALTER COLUMN user_id DROP NOT NULL;
