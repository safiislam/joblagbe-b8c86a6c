
-- Fix 1: Drop overly permissive chat_logs policies
DROP POLICY IF EXISTS "Anyone can update chat logs" ON public.chat_logs;
DROP POLICY IF EXISTS "Anyone can insert chat logs" ON public.chat_logs;

-- The edge function uses service_role_key which bypasses RLS,
-- so we don't need public INSERT/UPDATE policies at all.
-- Only admins need direct access via client.
