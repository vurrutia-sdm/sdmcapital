-- ============================================================
-- SDM Capital — Supabase SQL Schema
-- Copiar y pegar en: Supabase → SQL Editor → New Query
-- ============================================================

-- Habilitar extensiones
create extension if not exists "uuid-ossp";

-- ─── PROPIEDADES ─────────────────────────────────────────────
create table propiedades (
  id                uuid primary key default uuid_generate_v4(),
  titulo            text not null,
  titulo_en         text,
  descripcion       text not null default '',
  descripcion_en    text,
  tipo              text not null default 'casa'
                    check (tipo in ('casa','departamento','oficina','parcela','comercial','hotel','terreno','otro')),
  estado            text not null default 'en_venta'
                    check (estado in ('en_venta','en_arriendo','vendida','reservada')),
  precio_uf         numeric,
  precio_clp        numeric,
  precio_usd        numeric,
  a_consultar       boolean not null default false,
  dormitorios       integer,
  banos             integer,
  superficie_total  numeric,
  superficie_util   numeric,
  estacionamientos  integer,
  region            text not null default '',
  comuna            text not null default '',
  direccion         text,
  pais              text not null default 'Chile',
  ciudad            text,
  lat               numeric,
  lng               numeric,
  imagenes          text[] not null default '{}',
  imagen_principal  text,
  destacada         boolean not null default false,
  internacional     boolean not null default false,
  amenidades        text[],
  agente_id         uuid references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ─── BLOG ────────────────────────────────────────────────────
create table blog_posts (
  id              uuid primary key default uuid_generate_v4(),
  titulo          text not null,
  titulo_en       text,
  slug            text not null unique,
  resumen         text not null default '',
  resumen_en      text,
  contenido       text not null default '',
  contenido_en    text,
  imagen_portada  text,
  autor_id        uuid references auth.users(id),
  autor_nombre    text not null default 'Equipo SDM Capital',
  categoria       text not null default 'Mercado',
  tags            text[],
  publicado       boolean not null default false,
  destacado       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── EQUIPO ──────────────────────────────────────────────────
create table equipo (
  id        uuid primary key default uuid_generate_v4(),
  nombre    text not null,
  cargo     text not null,
  cargo_en  text,
  bio       text not null default '',
  bio_en    text,
  foto      text,
  email     text,
  telefono  text,
  linkedin  text,
  orden     integer not null default 0,
  activo    boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── ASOCIADOS ───────────────────────────────────────────────
create table asociados (
  id            uuid primary key default uuid_generate_v4(),
  nombre        text not null,
  logo          text not null default '',
  url           text not null,
  descripcion   text,
  descripcion_en text,
  orden         integer not null default 0,
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ─── SERVICIOS ───────────────────────────────────────────────
create table servicios (
  id                    uuid primary key default uuid_generate_v4(),
  slug                  text not null unique,
  titulo                text not null,
  titulo_en             text,
  descripcion_corta     text not null default '',
  descripcion_corta_en  text,
  descripcion_larga     text not null default '',
  descripcion_larga_en  text,
  icono                 text,
  imagen                text,
  orden                 integer not null default 0,
  activo                boolean not null default true
);

-- ─── CONTACTO MENSAJES ───────────────────────────────────────
create table contacto_mensajes (
  id                  uuid primary key default uuid_generate_v4(),
  nombre              text not null,
  email               text not null,
  telefono            text,
  mensaje             text not null,
  propiedad_interes   text,
  leido               boolean not null default false,
  created_at          timestamptz not null default now()
);

-- ─── UPDATED_AT trigger ──────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_propiedades_updated_at before update on propiedades
  for each row execute function set_updated_at();
create trigger trg_blog_updated_at before update on blog_posts
  for each row execute function set_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
alter table propiedades      enable row level security;
alter table blog_posts       enable row level security;
alter table equipo           enable row level security;
alter table asociados        enable row level security;
alter table servicios        enable row level security;
alter table contacto_mensajes enable row level security;

-- Lectura pública (propiedades publicadas, blog publicado, equipo, asociados, servicios)
create policy "public_read_propiedades" on propiedades
  for select using (true);

create policy "public_read_blog" on blog_posts
  for select using (publicado = true);

create policy "public_read_equipo" on equipo
  for select using (activo = true);

create policy "public_read_asociados" on asociados
  for select using (activo = true);

create policy "public_read_servicios" on servicios
  for select using (activo = true);

-- Cualquier visitante puede insertar mensajes de contacto
create policy "public_insert_contacto" on contacto_mensajes
  for insert with check (true);

-- Solo usuarios autenticados (admin) pueden leer mensajes y escribir en todo
create policy "admin_all_propiedades" on propiedades
  for all using (auth.role() = 'authenticated');

create policy "admin_all_blog" on blog_posts
  for all using (auth.role() = 'authenticated');

create policy "admin_all_mensajes" on contacto_mensajes
  for all using (auth.role() = 'authenticated');

create policy "admin_all_equipo" on equipo
  for all using (auth.role() = 'authenticated');

create policy "admin_all_asociados" on asociados
  for all using (auth.role() = 'authenticated');

-- ─── DATOS DE MUESTRA ────────────────────────────────────────
insert into equipo (nombre, cargo, cargo_en, bio, bio_en, orden) values
  ('Sebastián Díaz', 'Director General', 'CEO',
   'Más de 15 años de experiencia en inversión inmobiliaria en Chile y mercados internacionales. Especialista en estructuración de negocios y financiamiento.',
   'Over 15 years of experience in real estate investment in Chile and international markets.', 1),
  ('Marcela Rodríguez', 'Directora Comercial', 'Commercial Director',
   'Experta en desarrollo de negocios y relaciones con clientes. Lidera el área de captación y gestión de propiedades a nivel nacional.',
   'Expert in business development and client relations.', 2),
  ('Andrés Morales', 'Jefe de Inversiones', 'Head of Investments',
   'Especialista en análisis de mercado y valoración de activos inmobiliarios. Más de 10 años asesorando a inversionistas nacionales e internacionales.',
   'Specialist in market analysis and real estate asset valuation.', 3);

insert into propiedades (titulo, descripcion, tipo, estado, precio_uf, dormitorios, banos, superficie_total, region, comuna, pais, destacada) values
  ('Casa aislada 3D 2B · Casas del Oeste, Cerrillos',
   'Hermosa casa aislada en microbarrio tranquilo con excelente conectividad. Incluye cocina americana, living comedor, jardín y estacionamiento techado.',
   'casa', 'en_venta', 3499, 3, 2, 126, 'R. Metropolitana', 'Cerrillos', 'Chile', true),
  ('Casa 2D 2B a pasos Metro Plaza Quilicura',
   'Cómoda casa seminueva en conjunto residencial cerrado. A 5 minutos caminando del metro. Excelente inversión.',
   'casa', 'en_venta', 3137, 2, 2, 80, 'R. Metropolitana', 'Quilicura', 'Chile', true),
  ('Hotel + Restaurante · Futaleufú',
   'Excepcional oportunidad de inversión en uno de los destinos turísticos más prometedores de Chile. Hotel boutique con restaurante de autor.',
   'hotel', 'en_venta', null, null, null, null, 'Los Lagos', 'Futaleufú', 'Chile', false);
