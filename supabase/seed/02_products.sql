INSERT INTO public.products (title, description, price, discount, images, category_id, tags)
SELECT
  p.title, p.description, p.price, p.discount, p.images::jsonb, p.category_id::uuid, p.tags::text[]
FROM (
  VALUES
    (
      'Cámara Retro',
      'Cámara instantánea estilo film en excelente estado. Perfecta para fotografía callejera y momentos cotidianos.',
      149.99, 0,
      '[{"url":"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000002',
      ARRAY['foto','camara','retro']
    ),
    (
      'Jarrón Artesanal',
      'Jarrón de cerámica cocido dos veces para mayor textura. Cada pieza es única e irrepetible.',
      74.00, 10,
      '[{"url":"https://images.unsplash.com/photo-1578500351865-63fbcb2b59f5?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000005',
      ARRAY['hogar','decoracion','artesanal']
    ),
    (
      'Bicicleta Urbana',
      'Bicicleta de una velocidad con parrilla delantera. Ideal para desplazamientos diarios por la ciudad.',
      320.50, 0,
      '[{"url":"https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000007',
      ARRAY['bicicleta','ciclismo','urbano']
    ),
    (
      'Lámpara de Escritorio',
      'Lámpara de escritorio en latón con bombilla LED cálida. Perfecta para cualquier oficina en casa.',
      48.90, 15,
      '[{"url":"https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000003',
      ARRAY['iluminacion','oficina','hogar']
    ),
    (
      'Guitarra Acústica',
      'Guitarra acústica tipo parlor con funda. Ideal para principiantes y guitarristas de fingerstyle.',
      270.00, 0,
      '[{"url":"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000010',
      ARRAY['musica','guitarra','acustica']
    ),
    (
      'Zapatillas de Trail',
      'Zapatillas ligeras con protección extra en la puntera y suela de agarre agresivo.',
      112.00, 5,
      '[{"url":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000012',
      ARRAY['zapatillas','atletismo','exterior']
    ),
    (
      'Carcasa Universal Silicona',
      'Carcasa de silicona flexible con bordes reforzados. Compatible con múltiples modelos Apple.',
      12.99, 0,
      '[{"url":"https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000001',
      ARRAY['carcasa','telefono','silicona','apple']
    ),
    (
      'Pantalón Estampado Manzanas',
      'Pantalón de algodón con estampado de manzanas. Corte recto, cómodo para el día a día.',
      34.99, 0,
      '[{"url":"https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000011',
      ARRAY['pantalon','moda','estampado','ropa']
    )
) AS p(title, description, price, discount, images, category_id, tags)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);
