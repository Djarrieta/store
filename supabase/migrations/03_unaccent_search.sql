CREATE EXTENSION IF NOT EXISTS "unaccent" SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.f_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
  SELECT extensions.unaccent($1);
$$;

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS title_search text
    GENERATED ALWAYS AS (lower(public.f_unaccent(title))) STORED;

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS description_search text
    GENERATED ALWAYS AS (lower(public.f_unaccent(coalesce(description, '')))) STORED;
