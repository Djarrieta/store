WITH seed_user AS (
  SELECT id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1
)
INSERT INTO public.admin_users (user_id)
SELECT id FROM seed_user
ON CONFLICT (user_id) DO NOTHING;

WITH seed_user AS (
  SELECT id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1
)
INSERT INTO public.profiles (id, display_name, avatar_url)
SELECT id, 'Seed Admin', NULL
FROM seed_user
ON CONFLICT (id) DO UPDATE SET display_name = excluded.display_name;

WITH seed_user AS (
  SELECT id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1
)
INSERT INTO public.items (title, description, tags, images, price, category)
SELECT
  item_data.title,
  item_data.description,
  item_data.tags,
  item_data.images,
  item_data.price,
  item_data.category
FROM (SELECT 1) AS _dummy
CROSS JOIN (
  VALUES
    ('Retro Camera', 'Film-look instant camera in mint condition', ARRAY['photo','camera']::text[], '[{"url":"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200"}]'::jsonb, 149.99, 'Electronics'),
    ('Handmade Vase', 'Stoneware vase fired twice for texture depth', ARRAY['home','decor']::text[], '[{"url":"https://images.unsplash.com/photo-1578500351865-63fbcb2b59f5?q=80&w=1200"}]'::jsonb, 74.00, 'Home'),
    ('City Cruiser Bike', 'Single-speed urban bicycle with front rack', ARRAY['bike','transport']::text[], '[{"url":"https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=1200"}]'::jsonb, 320.50, 'Sports'),
    ('Desk Lamp', 'Adjustable brass desk lamp with warm LED bulb', ARRAY['lighting','office']::text[], '[{"url":"https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200"}]'::jsonb, 48.90, 'Home'),
    ('Acoustic Guitar', 'Parlor-size acoustic guitar with soft case', ARRAY['music','instrument']::text[], '[{"url":"https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=1200"}]'::jsonb, 270.00, 'Music'),
    ('Trail Running Shoes', 'Lightweight shoes with extra toe protection', ARRAY['outdoor','running']::text[], '[{"url":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200"}]'::jsonb, 112.00, 'Fashion')
) AS item_data(title, description, tags, images, price, category)
WHERE NOT EXISTS (SELECT 1 FROM public.items LIMIT 1);
