INSERT INTO public.ships (department, city, price_cop, estimated_days)
VALUES
  ('Antioquia',    'Medellín',   8000,  2),
  ('Antioquia',    'Rionegro',   9000,  2),
  ('Cundinamarca', 'Bogotá',    10000,  3),
  ('Valle del Cauca', 'Cali',  12000,  4)
ON CONFLICT (department, city) DO NOTHING;

INSERT INTO public.ships_config (singleton, free_above_cop)
VALUES (true, 150000)
ON CONFLICT (singleton) DO UPDATE SET free_above_cop = EXCLUDED.free_above_cop;
