DROP TABLE IF EXISTS public.ships_config CASCADE;
DROP TABLE IF EXISTS public.ships CASCADE;

CREATE TABLE public.ships (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department     text NOT NULL,
  city           text NOT NULL,
  price_cop      numeric(10,2) NOT NULL,
  estimated_days int NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ships_department_city_unique UNIQUE (department, city)
);

ALTER TABLE public.ships
  ADD COLUMN IF NOT EXISTS department_search text
    GENERATED ALWAYS AS (lower(public.f_unaccent(department))) STORED;

ALTER TABLE public.ships
  ADD COLUMN IF NOT EXISTS city_search text
    GENERATED ALWAYS AS (lower(public.f_unaccent(city))) STORED;

CREATE TRIGGER ships_updated_at
  BEFORE UPDATE ON public.ships
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Single-row config table (singleton pattern)
CREATE TABLE public.ships_config (
  singleton      boolean PRIMARY KEY DEFAULT true,
  free_above_cop numeric(10,2),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ships_config_singleton_true CHECK (singleton = true)
);

CREATE TRIGGER ships_config_updated_at
  BEFORE UPDATE ON public.ships_config
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Insert the one and only config row
INSERT INTO public.ships_config (singleton, free_above_cop)
VALUES (true, NULL)
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public.ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ships_config ENABLE ROW LEVEL SECURITY;

-- Public read (customers need to see shipping rates)
CREATE POLICY "ships: public read"
  ON public.ships FOR SELECT USING (true);

CREATE POLICY "ships: admin all"
  ON public.ships FOR ALL
  USING (public.is_admin(auth.uid()));

-- Public read for config (free shipping threshold)
CREATE POLICY "ships_config: public read"
  ON public.ships_config FOR SELECT USING (true);

-- Only admin can update the single config row
CREATE POLICY "ships_config: admin update"
  ON public.ships_config FOR UPDATE
  USING (public.is_admin(auth.uid()));
