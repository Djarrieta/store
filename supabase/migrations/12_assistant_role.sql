DROP FUNCTION IF EXISTS public.bot_create_order(text, text, jsonb, numeric, text);
DROP FUNCTION IF EXISTS public.bot_get_my_orders(text);
DROP FUNCTION IF EXISTS public.bot_get_order_status(uuid, text);

-- Create the limited role for the MCP server.
-- Password must be set out-of-band after running this migration:
--   ALTER ROLE assistant_bot WITH PASSWORD '...';
-- Then store the resulting connection string in ASSISTANT_DB_URL (never commit the password).
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'assistant_bot') THEN
    CREATE ROLE assistant_bot WITH LOGIN NOINHERIT;
  END IF;
END $$;

-- Strip any default public schema privileges
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM assistant_bot;
REVOKE ALL ON SCHEMA public FROM assistant_bot;
GRANT USAGE ON SCHEMA public TO assistant_bot;

-- Read-only access to public catalog tables only
GRANT SELECT ON public.products   TO assistant_bot;
GRANT SELECT ON public.categories TO assistant_bot;
GRANT SELECT ON public.items      TO assistant_bot;
GRANT SELECT ON public.content    TO assistant_bot;
-- NO direct access to orders or chat_messages

-- Controlled write: insert an order, returns the new order id
CREATE OR REPLACE FUNCTION public.bot_create_order(
  p_user_ref  text,
  p_user_name text,
  p_items     jsonb,
  p_total     numeric,
  p_notes     text DEFAULT NULL
) RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.orders (user_ref, user_name, items, total, notes)
  VALUES (p_user_ref, p_user_name, p_items, p_total, p_notes)
  RETURNING id;
$$;
GRANT EXECUTE ON FUNCTION public.bot_create_order TO assistant_bot;

-- Controlled read: returns only the calling user's orders
CREATE OR REPLACE FUNCTION public.bot_get_my_orders(p_user_ref text)
RETURNS TABLE(
  id uuid, status text, items jsonb, total numeric, notes text, created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, status, items, total, notes, created_at
  FROM public.orders
  WHERE user_ref = p_user_ref
  ORDER BY created_at DESC
  LIMIT 20;
$$;
GRANT EXECUTE ON FUNCTION public.bot_get_my_orders TO assistant_bot;

-- Controlled read: single order status, own orders only
CREATE OR REPLACE FUNCTION public.bot_get_order_status(p_order_id uuid, p_user_ref text)
RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT status FROM public.orders
  WHERE id = p_order_id AND user_ref = p_user_ref;
$$;
GRANT EXECUTE ON FUNCTION public.bot_get_order_status TO assistant_bot;
