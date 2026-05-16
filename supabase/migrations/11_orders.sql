DROP TABLE IF EXISTS public.orders CASCADE;

CREATE TABLE public.orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ref         text NOT NULL,
  user_name        text,
  status           text NOT NULL DEFAULT 'created'
                     CHECK (status IN ('created', 'pending_approval', 'approved', 'rejected', 'fulfilled', 'cancelled')),
  items            jsonb NOT NULL DEFAULT '[]',
  total            numeric(10,2) NOT NULL DEFAULT 0,
  notes            text,
  shipping_address jsonb,
  shipping_cost    numeric(10,2) NOT NULL DEFAULT 0,
  address_id       uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE INDEX orders_status_idx ON public.orders (status, created_at);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders: no public access"
  ON public.orders FOR ALL USING (false);

CREATE POLICY "orders: admin all"
  ON public.orders FOR ALL
  USING (public.is_admin(auth.uid()));

-- Authenticated users can create their own orders
CREATE POLICY "orders: user insert"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid()::text = user_ref);

-- Authenticated users can read their own orders
CREATE POLICY "orders: user select own"
  ON public.orders FOR SELECT
  USING (auth.uid()::text = user_ref);
