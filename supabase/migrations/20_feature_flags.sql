DROP TABLE IF EXISTS public.feature_flags CASCADE;

CREATE TABLE public.feature_flags (
  key         text PRIMARY KEY,
  enabled     boolean NOT NULL DEFAULT false,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can read flags
CREATE POLICY "feature_flags_select" ON public.feature_flags
  FOR SELECT USING (true);

-- Only admins can modify flags
CREATE POLICY "feature_flags_admin_insert" ON public.feature_flags
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "feature_flags_admin_update" ON public.feature_flags
  FOR UPDATE USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "feature_flags_admin_delete" ON public.feature_flags
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Seed the first flag
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('customizable_products', false, 'Enable product customization flow on the storefront');
