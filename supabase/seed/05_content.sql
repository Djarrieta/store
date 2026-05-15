INSERT INTO public.content (key, value)
VALUES
  ('about_paragraph', 'A community-driven catalog built with Next.js and Supabase.'),
  ('about_paragraph_2', 'Browse the catalog, discover items curated by our admins, and reach out if you find something you love.')
ON CONFLICT (key) DO NOTHING;
