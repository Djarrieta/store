DROP TABLE IF EXISTS public.addresses CASCADE;

CREATE TABLE public.addresses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  department     text NOT NULL,
  city           text NOT NULL,
  address_line   text NOT NULL,
  neighborhood   text,
  phone          text NOT NULL,
  is_default     boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- When a row is set as default, clear the previous default for the same user
CREATE OR REPLACE FUNCTION public.enforce_single_default_address()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id <> NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER addresses_single_default
  AFTER INSERT OR UPDATE OF is_default ON public.addresses
  FOR EACH ROW WHEN (NEW.is_default = true)
  EXECUTE PROCEDURE public.enforce_single_default_address();

-- After deleting the default address, promote the most recently created remaining one
CREATE OR REPLACE FUNCTION public.promote_default_address()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.is_default = true THEN
    UPDATE public.addresses
    SET is_default = true
    WHERE id = (
      SELECT id FROM public.addresses
      WHERE user_id = OLD.user_id
      ORDER BY created_at DESC
      LIMIT 1
    );
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE TRIGGER addresses_promote_default
  AFTER DELETE ON public.addresses
  FOR EACH ROW
  EXECUTE PROCEDURE public.promote_default_address();

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "addresses: user select own"
  ON public.addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "addresses: user insert"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses: user update own"
  ON public.addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "addresses: user delete own"
  ON public.addresses FOR DELETE
  USING (auth.uid() = user_id);
