-- ── Tarjetas de presentación del equipo ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS tarjetas_equipo (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  cargo text,
  telefono text,
  email text,
  direccion text DEFAULT 'Badajoz 100, of. 1014, Las Condes',
  web text DEFAULT 'www.sdmcapital.cl',
  orden integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tarjetas_equipo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated users"
ON tarjetas_equipo FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Seed inicial del equipo
INSERT INTO tarjetas_equipo (nombre, cargo, telefono, email, orden) VALUES
  ('Roberto de Jesús Urrutia', 'Director Comercial',  '(56) 9 3103 8954', 'rurrutia@sdmcapital.cl', 1),
  ('Víctor Urrutia',           'Asesor Comercial',    NULL,               'vurrutia@sdmcapital.cl', 2),
  ('Jocelyn Plaza P.',         'Asistente Comercial', NULL,               'jplaza@sdmcapital.cl',   3),
  ('Alfredo Robles',           'Asesor Legal',        NULL,               'arobles@sdmcapital.cl',  4);
