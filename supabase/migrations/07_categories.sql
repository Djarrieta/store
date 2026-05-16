DROP TABLE IF EXISTS public.categories CASCADE;

CREATE TABLE public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL,
  parent_id   uuid REFERENCES public.categories(id) ON DELETE RESTRICT,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX categories_slug_unique ON public.categories(slug);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories: public read"
  ON public.categories FOR SELECT USING (true);

CREATE POLICY "categories: admin insert"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "categories: admin update"
  ON public.categories FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "categories: admin delete"
  ON public.categories FOR DELETE
  USING (public.is_admin(auth.uid()));
