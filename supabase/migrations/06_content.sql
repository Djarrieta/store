DROP TABLE IF EXISTS public.content CASCADE;

CREATE TABLE public.content (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER content_updated_at
BEFORE UPDATE ON public.content
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content: public read"
  ON public.content FOR SELECT USING (true);

CREATE POLICY "content: admin update"
  ON public.content FOR UPDATE
  USING (public.is_admin(auth.uid()));
