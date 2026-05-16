DROP TABLE IF EXISTS public.items CASCADE;

CREATE TABLE public.items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  stock       integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER items_updated_at
BEFORE UPDATE ON public.items
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "items: admin select"
  ON public.items FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "items: admin insert"
  ON public.items FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "items: admin update"
  ON public.items FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "items: admin delete"
  ON public.items FOR DELETE
  USING (public.is_admin(auth.uid()));

DROP TABLE IF EXISTS public.item_categories CASCADE;

CREATE TABLE public.item_categories (
  item_id     uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  PRIMARY KEY (item_id, category_id)
);

ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "item_categories: public read"
  ON public.item_categories FOR SELECT USING (true);

CREATE POLICY "item_categories: admin insert"
  ON public.item_categories FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "item_categories: admin delete"
  ON public.item_categories FOR DELETE
  USING (public.is_admin(auth.uid()));
