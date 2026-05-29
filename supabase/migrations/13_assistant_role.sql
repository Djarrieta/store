DROP FUNCTION IF EXISTS public.bot_create_order(text, text, jsonb, numeric, text);
DROP FUNCTION IF EXISTS public.bot_get_my_orders(text);
DROP FUNCTION IF EXISTS public.bot_get_order_status(uuid, text);

-- Bot helper functions called via supabase .rpc() from the assistant service.

-- Insert an order, returns the new order id
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

-- Returns only the calling user's orders
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

-- Single order status, own orders only
CREATE OR REPLACE FUNCTION public.bot_get_order_status(p_order_id uuid, p_user_ref text)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'status', status,
    'tracking_code', tracking_code
  )
  FROM public.orders
  WHERE id = p_order_id AND user_ref = p_user_ref;
$$;
