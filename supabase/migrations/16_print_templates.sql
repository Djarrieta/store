DROP TABLE IF EXISTS public.print_templates CASCADE;
DROP FUNCTION IF EXISTS public.print_templates_kind_match() CASCADE;

CREATE TABLE public.print_templates (
  item_id      uuid PRIMARY KEY REFERENCES public.items(id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (kind IN ('phone_case', 'tshirt', 'mug')),
  label        text NOT NULL,
  attributes   jsonb NOT NULL DEFAULT '{}'::jsonb,
  width_mm     numeric NOT NULL CHECK (width_mm > 0),
  height_mm    numeric NOT NULL CHECK (height_mm > 0),
  print_dpi    integer NOT NULL DEFAULT 300 CHECK (print_dpi > 0),
  mockup_path  text,
  mask_path    text,
  safe_area    jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER print_templates_updated_at
BEFORE UPDATE ON public.print_templates
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Cross-table check: template.kind must match the parent product's customization_kind.
CREATE FUNCTION public.print_templates_kind_match() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE pk text;
BEGIN
  SELECT p.customization_kind INTO pk
  FROM public.items i
  JOIN public.products p ON p.id = i.product_id
  WHERE i.id = NEW.item_id;

  IF pk IS NULL OR pk <> NEW.kind THEN
    RAISE EXCEPTION
      'print_templates.kind (%) must match parent product.customization_kind (%)',
      NEW.kind, pk;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER print_templates_kind_match_trg
BEFORE INSERT OR UPDATE ON public.print_templates
FOR EACH ROW EXECUTE PROCEDURE public.print_templates_kind_match();

ALTER TABLE public.print_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "print_templates: public read"
  ON public.print_templates FOR SELECT USING (true);

CREATE POLICY "print_templates: admin insert"
  ON public.print_templates FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "print_templates: admin update"
  ON public.print_templates FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "print_templates: admin delete"
  ON public.print_templates FOR DELETE
  USING (public.is_admin(auth.uid()));
