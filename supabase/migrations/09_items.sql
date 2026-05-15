DROP TABLE IF EXISTS public.items CASCADE;

CREATE TABLE public.items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku         text,
  stock       integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX items_sku_unique ON public.items(sku) WHERE sku IS NOT NULL;

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
