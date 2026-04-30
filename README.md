# SDM Capital — Sitio Web Inmobiliario

Desarrollado por **HaikuFlow** para SDM Capital.

Stack: React 18 + Vite + TypeScript + Tailwind CSS + Supabase + Netlify

---

## Inicio rápido

### 1. Clonar e instalar
```bash
git clone <tu-repo>
cd sdm-capital
npm install
```

### 2. Variables de entorno
```bash
cp .env.example .env
```
Edita `.env` con tus credenciales de Supabase:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Base de datos Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor → New Query**
3. Pega el contenido de `supabase-schema.sql` y ejecuta
4. Crea un usuario admin en **Authentication → Users → Add User**

### 4. Desarrollo local
```bash
npm run dev
# Abre http://localhost:5173
```

### 5. Build para producción
```bash
npm run build
```

---

## Deploy en Netlify

1. Conecta tu repo GitHub a Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Agrega las variables de entorno en Netlify → Site settings → Environment variables

---

## Panel Admin

Accede en `/admin` con el email y contraseña del usuario creado en Supabase Auth.

Desde el admin puedes:
- ✅ Crear, editar y eliminar propiedades
- ✅ Escribir y publicar artículos de blog
- ✅ Ver y responder mensajes de contacto
- ✅ Gestionar equipo y asociados (desde Supabase directamente)

---

## Estructura del proyecto

```
src/
├── components/
│   ├── layout/       # Header, Footer, FloatingButtons, Layout
│   ├── sections/     # HeroSection, SearchBar, ContactSection
│   └── ui/           # PropertyCard
├── hooks/            # useLang, useScrollTop
├── lib/              # supabase.ts, i18n.ts
├── pages/            # Home, Propiedades, Blog, Admin, etc.
├── styles/           # globals.css
└── types/            # TypeScript types
```

---

## Paleta de colores

| Rol | Hex |
|-----|-----|
| Navy principal | `#1C3D5C` |
| Navy oscuro | `#0F2535` |
| Verde SDM | `#3DAA6E` |
| Azul cielo | `#A8C4DC` |
| Crema claro | `#F9FAFB` |

Tipografía: **Cormorant Garamond** (títulos) + **Inter** (cuerpo)

---

© 2025 SDM Capital — Diseño HaikuFlow (haikuflow.com)
