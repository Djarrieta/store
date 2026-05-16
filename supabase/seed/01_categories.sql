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

-- Variant categories (type = 'variant') — used as item variation dimensions
INSERT INTO public.categories (id, name, slug, parent_id, type) VALUES
  -- Talla
  ('b1000000-0000-0000-0000-000000000001', 'Talla',             'talla',              NULL,                                   'variant'),
  ('b1000000-0000-0000-0000-000000000002', 'S',                 'talla-s',            'b1000000-0000-0000-0000-000000000001', 'variant'),
  ('b1000000-0000-0000-0000-000000000003', 'M',                 'talla-m',            'b1000000-0000-0000-0000-000000000001', 'variant'),
  ('b1000000-0000-0000-0000-000000000004', 'L',                 'talla-l',            'b1000000-0000-0000-0000-000000000001', 'variant'),
  ('b1000000-0000-0000-0000-000000000005', 'XL',                'talla-xl',           'b1000000-0000-0000-0000-000000000001', 'variant'),
  -- Color
  ('b1000000-0000-0000-0000-000000000006', 'Color',             'color',              NULL,                                   'variant'),
  ('b1000000-0000-0000-0000-000000000007', 'Rojo',              'color-rojo',         'b1000000-0000-0000-0000-000000000006', 'variant'),
  ('b1000000-0000-0000-0000-000000000008', 'Amarillo',          'color-amarillo',     'b1000000-0000-0000-0000-000000000006', 'variant'),
  ('b1000000-0000-0000-0000-000000000009', 'Negro',             'color-negro',        'b1000000-0000-0000-0000-000000000006', 'variant'),
  ('b1000000-0000-0000-0000-000000000010', 'Blanco',            'color-blanco',       'b1000000-0000-0000-0000-000000000006', 'variant'),
  -- Modelo Apple
  ('b1000000-0000-0000-0000-000000000011', 'Modelo Apple',      'modelo-apple',       NULL,                                   'variant'),
  ('b1000000-0000-0000-0000-000000000012', 'iPhone 12',         'iphone-12',          'b1000000-0000-0000-0000-000000000011', 'variant'),
  ('b1000000-0000-0000-0000-000000000013', 'iPhone 13',         'iphone-13',          'b1000000-0000-0000-0000-000000000011', 'variant'),
  ('b1000000-0000-0000-0000-000000000014', 'iPhone 13 Pro Max', 'iphone-13-pro-max',  'b1000000-0000-0000-0000-000000000011', 'variant')
ON CONFLICT (id) DO NOTHING;
