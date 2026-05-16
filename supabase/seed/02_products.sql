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
      '[{"url":"https://http2.mlstatic.com/D_NQ_NP_2X_607610-MCO94686907877_102025-F.webp"}]',
      ARRAY['pantalon','ropa','estampado','fresas','verano']
    ),
    (
      'Carcasa para Celular',
      'Carcasa de silicona flexible con bordes reforzados y acabado mate. Protección contra caídas sin añadir grosor al celular.',
      14.99, 0,
      '[{"url":"https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?q=80&w=1200"}]',
      ARRAY['carcasa','celular','accesorios','silicona']
    )
) AS p(title, description, price, discount, images, tags)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);
