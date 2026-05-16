-- Top-level categories and subcategories with hardcoded UUIDs
-- so downstream seed files can reference them without lookups.

INSERT INTO public.categories (id, name, slug, parent_id) VALUES
  -- Nivel superior
  ('a1000000-0000-0000-0000-000000000001', 'Electrónica',    'electronica',  NULL),
  ('a1000000-0000-0000-0000-000000000004', 'Hogar',          'hogar',        NULL),
  ('a1000000-0000-0000-0000-000000000006', 'Deportes',       'deportes',     NULL),
  ('a1000000-0000-0000-0000-000000000009', 'Música',         'musica',       NULL),
  ('a1000000-0000-0000-0000-000000000011', 'Moda',           'moda',         NULL),
  -- Subcategorías: Electrónica
  ('a1000000-0000-0000-0000-000000000002', 'Cámaras',        'camaras',      'a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000003', 'Iluminación',    'iluminacion',  'a1000000-0000-0000-0000-000000000001'),
  -- Subcategorías: Hogar
  ('a1000000-0000-0000-0000-000000000005', 'Decoración',     'decoracion',   'a1000000-0000-0000-0000-000000000004'),
  -- Subcategorías: Deportes
  ('a1000000-0000-0000-0000-000000000007', 'Ciclismo',       'ciclismo',     'a1000000-0000-0000-0000-000000000006'),
  ('a1000000-0000-0000-0000-000000000008', 'Atletismo',      'atletismo',    'a1000000-0000-0000-0000-000000000006'),
  -- Subcategorías: Música
  ('a1000000-0000-0000-0000-000000000010', 'Instrumentos',   'instrumentos', 'a1000000-0000-0000-0000-000000000009'),
  -- Subcategorías: Moda
  ('a1000000-0000-0000-0000-000000000012', 'Calzado',        'calzado',      'a1000000-0000-0000-0000-000000000011')
ON CONFLICT (id) DO NOTHING;
