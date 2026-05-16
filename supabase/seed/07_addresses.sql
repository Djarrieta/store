INSERT INTO public.addresses (
  id,
  user_id,
  recipient_name,
  department,
  city,
  address_line,
  neighborhood,
  phone,
  is_default
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '7676fc0c-d1e2-4d47-b8cf-f6f5306a44c1',
  'Dario Arrieta',
  'Antioquia',
  'Rionegro',
  'Cl. 67 #54-297, Apto 808, Torre 2',
  'Urb. Manzanillos',
  '3008718217',
  true
) ON CONFLICT (id) DO NOTHING;
