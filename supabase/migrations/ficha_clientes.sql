-- ── Ficha Clientes ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ficha_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  correo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ficha_propiedades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES ficha_clientes(id) ON DELETE CASCADE,
  tipo TEXT,
  operacion TEXT,
  direccion TEXT,
  precio_uf NUMERIC,
  sup_util NUMERIC,
  sup_total NUMERIC,
  dormitorios INTEGER,
  banos INTEGER,
  estacionamientos INTEGER,
  descripcion TEXT,
  asesor_nombre TEXT,
  asesor_telefono TEXT,
  asesor_correo TEXT,
  fotos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ficha_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ficha_propiedades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON ficha_clientes FOR ALL USING (true);
CREATE POLICY "Allow all" ON ficha_propiedades FOR ALL USING (true);
