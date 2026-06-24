-- ── Captación de propiedades (formulario "Vende con Nosotros") ───────────────

CREATE TABLE IF NOT EXISTS captacion_propiedades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text,
  tipo_propiedad text,
  comuna text,
  precio_uf numeric,
  mensaje text,
  leido boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE captacion_propiedades ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede enviar el formulario público
CREATE POLICY "Cualquiera puede crear captaciones"
ON captacion_propiedades FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Solo usuarios autenticados (admin) pueden ver y gestionar las captaciones
CREATE POLICY "Lectura y gestión de captaciones para autenticados"
ON captacion_propiedades FOR ALL TO authenticated
USING (true) WITH CHECK (true);
