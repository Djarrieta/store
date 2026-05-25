-- Seed the three baseline customization kinds (phone case, t-shirt, mug).
-- Slugs are stable identifiers persisted in OrderCustomizationSnapshot.

INSERT INTO public.customization_kinds (id, slug, label, picker_label, attribute_schema, sort_order)
VALUES
  (
    'b2000000-0000-0000-0000-000000000001',
    'phone_case',
    'Funda de teléfono',
    'Elige tu teléfono',
    '[
      {"key":"brand","label":"Marca","type":"text","required":true,"placeholder":"ej. Apple"},
      {"key":"model","label":"Modelo","type":"text","required":true,"placeholder":"ej. iPhone 15 Pro"}
    ]'::jsonb,
    1
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    'tshirt',
    'Camiseta',
    'Elige tu talla',
    '[
      {"key":"placement","label":"Ubicación","type":"select","required":true,
       "options":[{"value":"front","label":"Frente"},{"value":"back","label":"Espalda"}]}
    ]'::jsonb,
    2
  ),
  (
    'b2000000-0000-0000-0000-000000000003',
    'mug',
    'Mug',
    'Elige el mug',
    '[
      {"key":"wrap","label":"Wrap","type":"select","required":true,
       "options":[{"value":"full","label":"Completo"},{"value":"partial","label":"Parcial"}]}
    ]'::jsonb,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  label = EXCLUDED.label,
  picker_label = EXCLUDED.picker_label,
  attribute_schema = EXCLUDED.attribute_schema,
  sort_order = EXCLUDED.sort_order;
