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
)
SELECT
  'a0000000-0000-0000-0000-000000000001',
  id,
  'Dario Arrieta',
  'Antioquia',
  'Rionegro',
  'Cl. 67 #54-297, Apto 808, Torre 2',
  'Urb. Manzanillos',
  '3008718217',
  true
FROM auth.users
LIMIT 1
ON CONFLICT (id) DO NOTHING;
