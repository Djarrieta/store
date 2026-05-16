-- Camiseta Básica — Talla Ropa (S/M/L/XL/XXL) × Color (Blanco/Negro/Azul Marino)
-- UUIDs: Talla Ropa b01..b06 | Color b20..b23
DO $$
DECLARE
  v_product_id uuid;
  v_item_id    uuid;
BEGIN
  SELECT id INTO v_product_id FROM public.products WHERE title = 'Camiseta Básica';
  IF v_product_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.items WHERE product_id = v_product_id
  ) THEN
    -- Blanco
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 20) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000002'), (v_item_id, 'b1000000-0000-0000-0000-000000000021'); -- S / Blanco
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 25) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000003'), (v_item_id, 'b1000000-0000-0000-0000-000000000021'); -- M / Blanco
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 22) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000004'), (v_item_id, 'b1000000-0000-0000-0000-000000000021'); -- L / Blanco
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 18) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000005'), (v_item_id, 'b1000000-0000-0000-0000-000000000021'); -- XL / Blanco
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 10) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000006'), (v_item_id, 'b1000000-0000-0000-0000-000000000021'); -- XXL / Blanco
    -- Negro
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 20) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000002'), (v_item_id, 'b1000000-0000-0000-0000-000000000022'); -- S / Negro
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 30) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000003'), (v_item_id, 'b1000000-0000-0000-0000-000000000022'); -- M / Negro
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 28) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000004'), (v_item_id, 'b1000000-0000-0000-0000-000000000022'); -- L / Negro
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 15) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000005'), (v_item_id, 'b1000000-0000-0000-0000-000000000022'); -- XL / Negro
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 8) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000006'), (v_item_id, 'b1000000-0000-0000-0000-000000000022'); -- XXL / Negro
    -- Azul Marino
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 15) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000002'), (v_item_id, 'b1000000-0000-0000-0000-000000000023'); -- S / Azul Marino
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 20) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000003'), (v_item_id, 'b1000000-0000-0000-0000-000000000023'); -- M / Azul Marino
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 18) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000004'), (v_item_id, 'b1000000-0000-0000-0000-000000000023'); -- L / Azul Marino
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 12) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000005'), (v_item_id, 'b1000000-0000-0000-0000-000000000023'); -- XL / Azul Marino
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 6) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000006'), (v_item_id, 'b1000000-0000-0000-0000-000000000023'); -- XXL / Azul Marino
  END IF;
END $$;

-- Pantalón Estampado Fresas — Talla Pantalón (32/34/36/38/40) × Color (Blanco/Negro/Azul Marino)
-- UUIDs: Talla Pantalón b10..b15 | Color b20..b23
DO $$
DECLARE
  v_product_id uuid;
  v_item_id    uuid;
BEGIN
  SELECT id INTO v_product_id FROM public.products WHERE title = 'Pantalón Estampado Fresas';
  IF v_product_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.items WHERE product_id = v_product_id
  ) THEN
    -- Blanco
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 12) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000011'), (v_item_id, 'b1000000-0000-0000-0000-000000000021'); -- 32 / Blanco
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 15) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000012'), (v_item_id, 'b1000000-0000-0000-0000-000000000021'); -- 34 / Blanco
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 18) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000013'), (v_item_id, 'b1000000-0000-0000-0000-000000000021'); -- 36 / Blanco
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 14) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000014'), (v_item_id, 'b1000000-0000-0000-0000-000000000021'); -- 38 / Blanco
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 10) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000015'), (v_item_id, 'b1000000-0000-0000-0000-000000000021'); -- 40 / Blanco
    -- Negro
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 14) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000011'), (v_item_id, 'b1000000-0000-0000-0000-000000000022'); -- 32 / Negro
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 18) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000012'), (v_item_id, 'b1000000-0000-0000-0000-000000000022'); -- 34 / Negro
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 20) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000013'), (v_item_id, 'b1000000-0000-0000-0000-000000000022'); -- 36 / Negro
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 16) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000014'), (v_item_id, 'b1000000-0000-0000-0000-000000000022'); -- 38 / Negro
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 8) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000015'), (v_item_id, 'b1000000-0000-0000-0000-000000000022'); -- 40 / Negro
    -- Azul Marino
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 10) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000011'), (v_item_id, 'b1000000-0000-0000-0000-000000000023'); -- 32 / Azul Marino
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 12) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000012'), (v_item_id, 'b1000000-0000-0000-0000-000000000023'); -- 34 / Azul Marino
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 15) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000013'), (v_item_id, 'b1000000-0000-0000-0000-000000000023'); -- 36 / Azul Marino
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 11) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000014'), (v_item_id, 'b1000000-0000-0000-0000-000000000023'); -- 38 / Azul Marino
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 7) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000015'), (v_item_id, 'b1000000-0000-0000-0000-000000000023'); -- 40 / Azul Marino
  END IF;
END $$;
