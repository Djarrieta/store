-- Top-level categories and subcategories with hardcoded UUIDs
-- so downstream seed files can reference them without lookups.

INSERT INTO public.categories (id, name, slug, parent_id) VALUES
  -- Top-level
  ('a1000000-0000-0000-0000-000000000001', 'Electronics',   'electronics',  NULL),
  ('a1000000-0000-0000-0000-000000000004', 'Home & Living',  'home-living',  NULL),
  ('a1000000-0000-0000-0000-000000000006', 'Sports',         'sports',        NULL),
  ('a1000000-0000-0000-0000-000000000009', 'Music',          'music',         NULL),
  ('a1000000-0000-0000-0000-000000000011', 'Fashion',        'fashion',       NULL),
  -- Subcategories: Electronics
  ('a1000000-0000-0000-0000-000000000002', 'Cameras',        'cameras',       'a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000003', 'Lighting',       'lighting',      'a1000000-0000-0000-0000-000000000001'),
  -- Subcategories: Home & Living
  ('a1000000-0000-0000-0000-000000000005', 'Decor',          'decor',         'a1000000-0000-0000-0000-000000000004'),
  -- Subcategories: Sports
  ('a1000000-0000-0000-0000-000000000007', 'Cycling',        'cycling',       'a1000000-0000-0000-0000-000000000006'),
  ('a1000000-0000-0000-0000-000000000008', 'Running',        'running',       'a1000000-0000-0000-0000-000000000006'),
  -- Subcategories: Music
  ('a1000000-0000-0000-0000-000000000010', 'Instruments',    'instruments',   'a1000000-0000-0000-0000-000000000009'),
  -- Subcategories: Fashion
  ('a1000000-0000-0000-0000-000000000012', 'Footwear',       'footwear',      'a1000000-0000-0000-0000-000000000011')
ON CONFLICT (id) DO NOTHING;
