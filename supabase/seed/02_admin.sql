-- Restore profile and grant admin for the local dev user.
-- This runs after migrations wipe the profiles/admin_users tables.
INSERT INTO public.profiles (id, display_name, avatar_url, is_admin)
SELECT
  id,
  coalesce(raw_user_meta_data ->> 'display_name', split_part(email, '@', 1)),
  raw_user_meta_data ->> 'avatar_url',
  true
FROM auth.users
WHERE id = '7676fc0c-d1e2-4d47-b8cf-f6f5306a44c1'
ON CONFLICT (id) DO UPDATE SET is_admin = true;

INSERT INTO public.admin_users (user_id)
VALUES ('7676fc0c-d1e2-4d47-b8cf-f6f5306a44c1')
ON CONFLICT DO NOTHING;
