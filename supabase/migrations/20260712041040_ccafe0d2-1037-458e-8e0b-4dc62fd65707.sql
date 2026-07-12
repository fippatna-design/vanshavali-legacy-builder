INSERT INTO public.user_roles (user_id, role)
VALUES ('3c1d11a2-ab7d-4c70-889d-bbd3ccc78c9b', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;