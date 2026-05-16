INSERT INTO public.content (key, value)
VALUES
  ('about_paragraph', 'Un catálogo comunitario construido con Next.js y Supabase.'),
  ('about_paragraph_2', 'Explora el catálogo, descubre productos seleccionados por nuestros administradores y contáctanos si encuentras algo que te encante.')
ON CONFLICT (key) DO NOTHING;
