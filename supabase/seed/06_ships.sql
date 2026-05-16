INSERT INTO public.ships (department, city, price_cop, estimated_days)
VALUES
  ('Antioquia',    'Medellín',  8000,  2),
  ('Cundinamarca', 'Bogotá',   10000,  3),
  ('Valle del Cauca', 'Cali',  12000,  4)
ON CONFLICT (department, city) DO NOTHING;
