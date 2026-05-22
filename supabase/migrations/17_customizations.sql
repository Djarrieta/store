DROP TABLE IF EXISTS public.customizations CASCADE;

CREATE TABLE public.customizations (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id            uuid NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  source_image_path  text NOT NULL,
  source_width_px    integer NOT NULL CHECK (source_width_px > 0),
  source_height_px   integer NOT NULL CHECK (source_height_px > 0),
  transform          jsonb NOT NULL,
  preview_path       text NOT NULL,
  print_path         text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER customizations_updated_at
BEFORE UPDATE ON public.customizations
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE INDEX customizations_user_idx ON public.customizations (user_id, created_at DESC);
CREATE INDEX customizations_item_idx ON public.customizations (item_id);

ALTER TABLE public.customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customizations: owner or admin select"
  ON public.customizations FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "customizations: owner insert"
  ON public.customizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "customizations: owner or admin update"
  ON public.customizations FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "customizations: owner or admin delete"
  ON public.customizations FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
