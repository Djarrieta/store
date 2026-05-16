-- Simple products: one item each, no variant categories
INSERT INTO public.items (product_id, stock)
SELECT p.id, v.stock::integer
FROM (
  VALUES
    ('Cámara Retro',          12),
    ('Jarrón Artesanal',       8),
    ('Bicicleta Urbana',       5),
    ('Lámpara de Escritorio', 20),
    ('Guitarra Acústica',      7),
    ('Zapatillas de Trail',   15)
) AS v(title, stock)
JOIN public.products p ON p.title = v.title
WHERE NOT EXISTS (SELECT 1 FROM public.items LIMIT 1);

-- Carcasa Universal Silicona — one item per Modelo Apple
DO $$
DECLARE
  v_product_id uuid;
  v_item_id    uuid;
BEGIN
  SELECT id INTO v_product_id FROM public.products WHERE title = 'Carcasa Universal Silicona';
  IF v_product_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.items WHERE product_id = v_product_id
  ) THEN
    -- iPhone 12
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 15) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000012');
    -- iPhone 13
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 20) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000013');
    -- iPhone 13 Pro Max
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 8) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000014');
  END IF;
END $$;

-- Pantalón Estampado Manzanas — one item per Talla × Color combination
DO $$
DECLARE
  v_product_id uuid;
  v_item_id    uuid;
BEGIN
  SELECT id INTO v_product_id FROM public.products WHERE title = 'Pantalón Estampado Manzanas';
  IF v_product_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.items WHERE product_id = v_product_id
  ) THEN
    -- S / Rojo
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 10) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000002');
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000007');
    -- S / Amarillo
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 7) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000002');
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000008');
    -- M / Rojo
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 12) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000003');
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000007');
    -- M / Amarillo
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 9) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000003');
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000008');
    -- L / Rojo
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 5) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000004');
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000007');
    -- L / Amarillo
    INSERT INTO public.items (product_id, stock) VALUES (v_product_id, 4) RETURNING id INTO v_item_id;
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000004');
    INSERT INTO public.item_categories VALUES (v_item_id, 'b1000000-0000-0000-0000-000000000008');
  END IF;
END $$;
