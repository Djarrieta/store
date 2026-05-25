DROP TABLE IF EXISTS public.customization_kinds CASCADE;

CREATE TABLE public.customization_kinds (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text NOT NULL UNIQUE,
  label             text NOT NULL,
  picker_label      text NOT NULL,
  attribute_schema  jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order        integer NOT NULL DEFAULT 0,
  archived          boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER customization_kinds_updated_at
BEFORE UPDATE ON public.customization_kinds
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.customization_kinds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customization_kinds: public read"
  ON public.customization_kinds FOR SELECT USING (true);

CREATE POLICY "customization_kinds: admin insert"
  ON public.customization_kinds FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "customization_kinds: admin update"
  ON public.customization_kinds FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "customization_kinds: admin delete"
  ON public.customization_kinds FOR DELETE
  USING (public.is_admin(auth.uid()));
