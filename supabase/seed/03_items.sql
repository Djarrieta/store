-- One stock item per product. SKUs follow a simple pattern.
INSERT INTO public.items (product_id, sku, stock)
SELECT p.id, p.sku, p.stock
FROM (
  SELECT
    products.id,
    'SKU-' || upper(substring(products.title, 1, 3)) || '-001' AS sku,
    floor(random() * 20 + 5)::integer AS stock
  FROM public.products
) AS p
WHERE NOT EXISTS (SELECT 1 FROM public.items LIMIT 1);
