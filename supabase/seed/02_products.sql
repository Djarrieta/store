INSERT INTO public.products (title, description, price, discount, images, tags)
SELECT
  p.title, p.description, p.price, p.discount, p.images::jsonb, p.tags::text[]
FROM (
  VALUES
    (
      'Camiseta Básica',
      'Camiseta de algodón 100% con cuello redondo y corte regular. Suave, transpirable y perfecta para el día a día.',
      24.99, 0,
      '[{"url":"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200"}]',
      ARRAY['camiseta','ropa','basica','algodon','unisex']
    ),
    (
      'Pantalón Estampado Fresas',
      'Pantalón de algodón con estampado de fresas. Corte recto y cómodo, ideal para looks casuales y de verano.',
      39.99, 0,
      '[{"url":"https://images.unsplash.com/photo-1594938298603-c8148c4b4f7e?q=80&w=1200"}]',
      ARRAY['pantalon','ropa','estampado','fresas','verano']
    )
) AS p(title, description, price, discount, images, tags)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);
