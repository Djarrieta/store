---
applyTo: "supabase/migrations/*.sql"
---

# Migration Conventions

- **Edit existing files, don't create new ones** — unless adding a brand-new module that has no migration file yet.
- New files follow the naming convention: pick the next available `NN` prefix (e.g. if `13_foo.sql` is the last, use `14_bar.sql`).
- After any change, run `npm run db:reset` to apply.
- Each file is idempotent: start with `DROP TABLE IF EXISTS public.<table> CASCADE;`.
- Naming: `NN_<module>.sql` — zero-padded two-digit prefix (e.g. `01_profiles.sql`, `12_foo.sql`).

## Standard table template

```sql
DROP TABLE IF EXISTS public.<entities> CASCADE;

CREATE TABLE public.<entities> (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid()
                   REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  tags        text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER <entities>_updated_at
  BEFORE UPDATE ON public.<entities>
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.<entities> ENABLE ROW LEVEL SECURITY;
```

## RLS policies

- Public catalog tables (admin-managed): `WITH CHECK (is_admin(auth.uid()))` for INSERT/UPDATE/DELETE.
- User-owned tables: `USING (auth.uid() = user_id)`.
- Public read for all: `FOR SELECT USING (true)`.

## Search columns (accent-insensitive)

Add to the searchable table in `03_unaccent_search.sql`:

```sql
ALTER TABLE public.<entities>
  ADD COLUMN IF NOT EXISTS title_search text
    GENERATED ALWAYS AS (lower(public.f_unaccent(title))) STORED;
ALTER TABLE public.<entities>
  ADD COLUMN IF NOT EXISTS description_search text
    GENERATED ALWAYS AS (lower(public.f_unaccent(coalesce(description, '')))) STORED;
```

Query via `.ilike("title_search", `%${term}%`)`.

## Images column (when needed)

```sql
images jsonb NOT NULL DEFAULT '[]'::jsonb
```

TypeScript: `{ url: string; description?: string }[]`
