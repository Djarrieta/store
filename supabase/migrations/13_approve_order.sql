DROP FUNCTION IF EXISTS public.approve_order(uuid);

-- Atomically approves an order: deducts stock for every line item and sets status = 'approved'.
-- Called via supabase.rpc('approve_order', { p_order_id }) from the admin server action.
-- Runs inside a single transaction — any stock shortfall rolls back the whole operation.
CREATE OR REPLACE FUNCTION public.approve_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order  public.orders;
  v_item   jsonb;
  v_rows   int;
BEGIN
  SELECT * INTO v_order FROM public.orders
  WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  IF v_order.status <> 'pending_approval' THEN
    RAISE EXCEPTION 'Order % is not pending approval (current status: %)', p_order_id, v_order.status;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(v_order.items)
  LOOP
    UPDATE public.items
    SET stock = stock - (v_item->>'qty')::int
    WHERE product_id = (v_item->>'product_id')::uuid
      AND stock >= (v_item->>'qty')::int;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
      RAISE EXCEPTION 'Insufficient stock for product %', v_item->>'product_id';
    END IF;
  END LOOP;

  UPDATE public.orders SET status = 'approved' WHERE id = p_order_id;
END;
$$;
