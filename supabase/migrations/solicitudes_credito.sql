-- ── Solicitudes de crédito hipotecario (sección "Financiamiento Personas") ───

CREATE TABLE IF NOT EXISTS solicitudes_credito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  apellidos text NOT NULL,
  email text NOT NULL,
  telefono text NOT NULL,
  rut text NOT NULL,
  accion text,               -- 'compra' | 'refinanciamiento'
  tipo_propiedad text,
  condicion_propiedad text,  -- 'nueva' | 'usada'
  valor_uf numeric,
  situacion_laboral text,
  documentos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE solicitudes_credito ENABLE ROW LEVEL SECURITY;

-- El formulario público (anon key) puede crear solicitudes
CREATE POLICY "Cualquiera puede crear solicitudes de crédito"
ON solicitudes_credito FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Solo usuarios autenticados (admin) pueden leer y gestionar las solicitudes
CREATE POLICY "Lectura y gestión de solicitudes para autenticados"
ON solicitudes_credito FOR ALL TO authenticated
USING (true) WITH CHECK (true);


-- ── Storage: bucket privado para documentos de respaldo ──────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-credito', 'documentos-credito', false)
ON CONFLICT (id) DO NOTHING;

-- El formulario público puede subir archivos (no puede leerlos de vuelta)
CREATE POLICY "Cualquiera puede subir documentos de crédito"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'documentos-credito');

-- Solo usuarios autenticados (admin) pueden ver/descargar los documentos
CREATE POLICY "Autenticados pueden leer documentos de crédito"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documentos-credito');
