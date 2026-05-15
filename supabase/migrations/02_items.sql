DROP TABLE IF EXISTS public.items CASCADE;

CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  tags text[] NOT NULL DEFAULT '{}',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  price numeric(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT items_user_id_profiles_fk
    FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TRIGGER items_updated_at
BEFORE UPDATE ON public.items
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "items: public read"
  ON public.items FOR SELECT USING (true);

CREATE POLICY "items: admin insert"
  ON public.items FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "items: admin update"
  ON public.items FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "items: admin delete"
  ON public.items FOR DELETE
  USING (public.is_admin(auth.uid()));
