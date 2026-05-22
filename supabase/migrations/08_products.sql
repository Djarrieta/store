DROP TABLE IF EXISTS public.products CASCADE;

CREATE TABLE public.products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  description         text,
  price               numeric(10,2) NOT NULL DEFAULT 0,
  discount            numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
  images              jsonb NOT NULL DEFAULT '[]'::jsonb,
  category_id         uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  tags                text[] NOT NULL DEFAULT '{}',
  ocultar             boolean NOT NULL DEFAULT false,
  customizable        boolean NOT NULL DEFAULT false,
  customization_kind  text CHECK (customization_kind IN ('phone_case', 'tshirt', 'mug')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_customizable_requires_kind
    CHECK (customizable = false OR customization_kind IS NOT NULL)
);

CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS title_search text
    GENERATED ALWAYS AS (lower(public.f_unaccent(title))) STORED;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description_search text
    GENERATED ALWAYS AS (lower(public.f_unaccent(coalesce(description, '')))) STORED;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products: public read"
  ON public.products FOR SELECT USING (true);

CREATE POLICY "products: admin insert"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "products: admin update"
  ON public.products FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "products: admin delete"
  ON public.products FOR DELETE
  USING (public.is_admin(auth.uid()));
