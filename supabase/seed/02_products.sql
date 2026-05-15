INSERT INTO public.products (title, description, price, discount, images, category_id, tags)
SELECT
  p.title, p.description, p.price, p.discount, p.images::jsonb, p.category_id::uuid, p.tags::text[]
FROM (
  VALUES
    (
      'Retro Camera',
      'Film-look instant camera in mint condition. Perfect for street photography and everyday moments.',
      149.99, 0,
      '[{"url":"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000002',
      ARRAY['photo','camera','retro']
    ),
    (
      'Handmade Vase',
      'Stoneware vase fired twice for texture depth. Each piece is one of a kind.',
      74.00, 10,
      '[{"url":"https://images.unsplash.com/photo-1578500351865-63fbcb2b59f5?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000005',
      ARRAY['home','decor','handmade']
    ),
    (
      'City Cruiser Bike',
      'Single-speed urban bicycle with front rack. Ideal for daily commutes.',
      320.50, 0,
      '[{"url":"https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000007',
      ARRAY['bike','cycling','urban']
    ),
    (
      'Desk Lamp',
      'Adjustable brass desk lamp with warm LED bulb. Fits any home office setup.',
      48.90, 15,
      '[{"url":"https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000003',
      ARRAY['lighting','office','home']
    ),
    (
      'Acoustic Guitar',
      'Parlor-size acoustic guitar with soft case. Great for beginners and fingerstyle players.',
      270.00, 0,
      '[{"url":"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000010',
      ARRAY['music','guitar','acoustic']
    ),
    (
      'Trail Running Shoes',
      'Lightweight shoes with extra toe protection and aggressive grip sole.',
      112.00, 5,
      '[{"url":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200"}]',
      'a1000000-0000-0000-0000-000000000012',
      ARRAY['shoes','running','outdoor']
    )
) AS p(title, description, price, discount, images, category_id, tags)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);
