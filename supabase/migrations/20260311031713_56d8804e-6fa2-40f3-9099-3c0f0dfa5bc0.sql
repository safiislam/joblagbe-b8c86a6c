
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'mehedidesign1@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
