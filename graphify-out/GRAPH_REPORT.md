# Graph Report - .  (2026-06-13)

## Corpus Check
- 68 files · ~70,932 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 538 nodes · 836 edges · 35 communities (29 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.72)
- Token cost: 348,813 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_FichaCliente Admin CRM|FichaCliente Admin CRM]]
- [[_COMMUNITY_Cotizaciones PDF Module|Cotizaciones PDF Module]]
- [[_COMMUNITY_Captacion Chat Admin|Captacion Chat Admin]]
- [[_COMMUNITY_AdminPage Core Module|AdminPage Core Module]]
- [[_COMMUNITY_Cotizaciones Wizard Admin|Cotizaciones Wizard Admin]]
- [[_COMMUNITY_Layout and Content Hooks|Layout and Content Hooks]]
- [[_COMMUNITY_Tarjetas Print Pipeline|Tarjetas Print Pipeline]]
- [[_COMMUNITY_Property Catalog Pages|Property Catalog Pages]]
- [[_COMMUNITY_Tarjeta Card Types and Markup|Tarjeta Card Types and Markup]]
- [[_COMMUNITY_NPM Production Dependencies|NPM Production Dependencies]]
- [[_COMMUNITY_Legal Pages CMS|Legal Pages CMS]]
- [[_COMMUNITY_TS Compiler Options|TS Compiler Options]]
- [[_COMMUNITY_Blog and Shared Types|Blog and Shared Types]]
- [[_COMMUNITY_i18n and App Routing|i18n and App Routing]]
- [[_COMMUNITY_Property Detail and Maps|Property Detail and Maps]]
- [[_COMMUNITY_Admin Property Forms and MapPicker|Admin Property Forms and MapPicker]]
- [[_COMMUNITY_El Barranco Showcase|El Barranco Showcase]]
- [[_COMMUNITY_NPM Dev Dependencies|NPM Dev Dependencies]]
- [[_COMMUNITY_Agentes Admin and Tarjetas Equipo|Agentes Admin and Tarjetas Equipo]]
- [[_COMMUNITY_Admin Auth and Hero Section|Admin Auth and Hero Section]]
- [[_COMMUNITY_Blog Admin and Tarjetas Actions|Blog Admin and Tarjetas Actions]]
- [[_COMMUNITY_SEO and Content Pages|SEO and Content Pages]]
- [[_COMMUNITY_Asociados and PropertyCard|Asociados and PropertyCard]]
- [[_COMMUNITY_SearchBar and Comunas Picker|SearchBar and Comunas Picker]]
- [[_COMMUNITY_Package Metadata|Package Metadata]]
- [[_COMMUNITY_Build Config Files|Build Config Files]]
- [[_COMMUNITY_tsconfig.node Compiler Options|tsconfig.node Compiler Options]]
- [[_COMMUNITY_ContactSection and Mensaje Type|ContactSection and Mensaje Type]]
- [[_COMMUNITY_Brand Image Assets|Brand Image Assets]]
- [[_COMMUNITY_Cotizacion Interface|Cotizacion Interface]]
- [[_COMMUNITY_CotizacionDraft Type|CotizacionDraft Type]]
- [[_COMMUNITY_FiltrosPropiedades Interface|FiltrosPropiedades Interface]]
- [[_COMMUNITY_MiembroEquipo Interface|MiembroEquipo Interface]]
- [[_COMMUNITY_Servicio Interface|Servicio Interface]]
- [[_COMMUNITY_useScrollTop Hook|useScrollTop Hook]]

## God Nodes (most connected - your core abstractions)
1. `useLang()` - 21 edges
2. `compilerOptions` - 16 edges
3. `supabase client` - 16 edges
4. `PropiedadesAdmin` - 15 edges
5. `useContenido()` - 11 edges
6. `SEO()` - 10 edges
7. `getComunas()` - 10 edges
8. `CotizacionesAdmin panel` - 10 edges
9. `Propiedad` - 8 edges
10. `SearchBar` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Schema.org RealEstateAgent JSON-LD` --conceptually_related_to--> `propiedades table`  [INFERRED]
  index.html → supabase-schema.sql
- `loadCots function` --conceptually_related_to--> `propiedades table`  [INFERRED]
  src/components/cotizaciones/CotizacionesAdmin.tsx → supabase-schema.sql
- `CotizacionWizard component (5-step)` --shares_data_with--> `propiedades table`  [INFERRED]
  src/components/cotizaciones/CotizacionesAdmin.tsx → supabase-schema.sql
- `TarjetaForm` --semantically_similar_to--> `PropiedadesAdmin`  [INFERRED] [semantically similar]
  src/components/tarjetas/TarjetasEquipo.tsx → src/pages/AdminPage.tsx
- `BlogPage()` --calls--> `useLang()`  [EXTRACTED]
  src/pages/BlogPage.tsx → src/hooks/useLang.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Public site layout shell (Header + Footer + FloatingButtons rendered via Layout/Outlet)** — layout_layout, layout_header, layout_footer, layout_floatingbuttons, layout_scrolltotop [EXTRACTED 0.95]
- **Duplicated currency/date/number formatter helpers across CotizacionesAdmin and CotizacionPDF** — cotizacionesadmin_pad, cotizacionesadmin_fmtn, cotizacionpdf_pad, cotizacionpdf_fmtn, cotizacionpdf_fmtuf, cotizacionpdf_fmtclp [INFERRED 0.85]
- **End-to-end cotización flow: wizard collects data, generates PDF, sends via Gmail** — cotizacionesadmin_cotizacionwizard, cotizacionesadmin_onsave, cotizaciones_cotizacionpdf, cotizacionesadmin_opengmail [EXTRACTED 0.95]
- **Team Business Card Generation & Print Pipeline** — tarjetasequipo_tarjetasequipo, tarjetacard_tarjetafrente, tarjetacard_tarjetareverso, markup_fronthtml, markup_backhtml, imprimir_imprimirtarjeta, markup_cropshtml [EXTRACTED 0.95]
- **Chile Region/Comuna Selection Across Search and Admin** — comunas_chile_regiones_comunas, comunas_chile_getcomunas, searchbar_regioncomunapicker, adminpage_propiedadesadmin [INFERRED 0.85]
- **Google Maps Address Picker / Property Map Integration** — mappicker_mappicker, propertymap_propertymap, adminpage_propiedadesadmin, index_propiedad [INFERRED 0.85]
- **Editable legal pages with Supabase fallback (Privacidad, Condiciones, Eliminación)** — pages_politicaprivacidadpage, pages_condicionesserviciopage, pages_eliminaciondatospage, paginas_legales_paginas_legales [EXTRACTED 0.95]
- **Ficha cliente CRUD flow (lista -> detalle -> nueva/editar/ver)** — admin_fichaclienteslista, admin_fichaclientedetalle, admin_fichaclientenueva, admin_fichaclienteeditar, admin_fichaclientever, ficha_clientes_ficha_propiedades [EXTRACTED 0.95]
- **El Barranco hotel listing cross-promotion (detail page banner -> dedicated showcase -> CMS table)** — pages_propiedaddetailpage, pages_elbarrancoshowcase, showcase_barranco_table [EXTRACTED 0.90]

## Communities (35 total, 6 thin omitted)

### Community 0 - "FichaCliente Admin CRM"
Cohesion: 0.05
Nodes (33): Cliente, Ficha, FichaClienteDetalle(), inp, useAdminAuth(), Agente, AnyPhoto, ExistingPhoto (+25 more)

### Community 1 - "Cotizaciones PDF Module"
Cohesion: 0.05
Nodes (44): NotFound component, Cotizaciones module (quote wizard + PDF + Gmail), C, CotizacionPDF(), estadoColor, estadoLabel, fmtCLP(), fmtDate() (+36 more)

### Community 2 - "Captacion Chat Admin"
Cohesion: 0.06
Nodes (30): Captacion(), ChatMsg, COLORS, ConversacionThread(), DetailTab, EditLeadDraft, fmt(), formatHora() (+22 more)

### Community 3 - "AdminPage Core Module"
Cohesion: 0.06
Nodes (14): AdminPage(), AsociadosAdmin(), DEFAULT_TABS, EquipoAdmin(), HERO_KEYS, HERO_POS_KEYS, LEGAL_PAGES, POSITION_OPTIONS (+6 more)

### Community 4 - "Cotizaciones Wizard Admin"
Cohesion: 0.08
Nodes (21): calcDividendo(), CotizacionesAdmin(), CotizacionWizard(), EMPTY_DRAFT, ESTADO_COLORS, ESTADO_LABELS, fmtN(), FORMA_LABELS (+13 more)

### Community 5 - "Layout and Content Hooks"
Cohesion: 0.09
Nodes (19): SocialIcon component, handleContacto function, Contenido, invalidateContenidoCache(), useContenido(), useScrollTop(), FloatingButtons(), Footer() (+11 more)

### Community 6 - "Tarjetas Print Pipeline"
Cohesion: 0.17
Nodes (15): capturarCara(), imprimirTarjeta(), backHTML(), cropsHTML(), esc(), frontHTML(), IC, TARJETA_DEFAULTS (+7 more)

### Community 7 - "Property Catalog Pages"
Cohesion: 0.14
Nodes (16): CITIES, SAMPLE_PROPS, TESTIMONIALS, applyCatalogOrder(), ESTADOS, ETIQUETAS_FILTRO, PRECIOS, PropiedadesPage() (+8 more)

### Community 8 - "Tarjeta Card Types and Markup"
Cohesion: 0.15
Nodes (19): capturarCara, imprimirTarjeta, PRINT_CSS, backHTML, cropsHTML, esc, frontHTML, MONO logo markup (+11 more)

### Community 9 - "NPM Production Dependencies"
Cohesion: 0.11
Nodes (18): dependencies, html-to-image, jspdf, lucide-react, react, react-dom, @react-pdf/renderer, react-router-dom (+10 more)

### Community 10 - "Legal Pages CMS"
Cohesion: 0.21
Nodes (13): Editable legal pages pattern (Supabase + fallback HTML), useLang(), AsociadosPage(), CondicionesServicioPage(), EliminacionDatosPage(), PoliticaPrivacidadPage(), Escritura de páginas legales para autenticados RLS policy, Seed: condiciones-del-servicio row (+5 more)

### Community 11 - "TS Compiler Options"
Cohesion: 0.12
Nodes (17): compilerOptions, allowImportingTsExtensions, baseUrl, ignoreDeprecations, isolatedModules, jsx, lib, module (+9 more)

### Community 12 - "Blog and Shared Types"
Cohesion: 0.15
Nodes (12): BlogPostPage(), ShareButtons(), BlogPost, CategoriaPropiedad, CotizacionDraft, EstadoCotizacion, EstadoPropiedad, EtapaConstruccion (+4 more)

### Community 13 - "i18n and App Routing"
Cohesion: 0.20
Nodes (8): LangContext, LangContextType, LangProvider(), ScrollToTop(), TranslationKey, translations, Lang, LangProvider

### Community 14 - "Property Detail and Maps"
Cohesion: 0.14
Nodes (9): supabaseAnonKey, supabaseUrl, ETAPA_LABELS, PropiedadDetailPage(), SHARE_NETWORKS, SUBSIDIO_LABELS, MapView(), PropertyMapProps (+1 more)

### Community 15 - "Admin Property Forms and MapPicker"
Cohesion: 0.15
Nodes (13): DossierUploader, ImageUploader, PropiedadesAdmin, PropImageManager, RichTextEditor, useDragSort, MapPicker, MAPS_KEY (MapPicker) (+5 more)

### Community 16 - "El Barranco Showcase"
Cohesion: 0.15
Nodes (7): El Barranco cross-sell banner pattern, C, Icon, IMG, S, Allow all for authenticated users RLS policy (travel_guide), travel_guide table

### Community 17 - "NPM Dev Dependencies"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, postcss, tailwindcss, @types/react, @types/react-dom, typescript, @typescript-eslint/eslint-plugin (+3 more)

### Community 18 - "Agentes Admin and Tarjetas Equipo"
Cohesion: 0.22
Nodes (8): Agente, Agentes(), inp, ModalForm, useAdminAuth(), Allow all for authenticated users RLS policy (tarjetas_equipo), Seed: equipo inicial rows, tarjetas_equipo table

### Community 19 - "Admin Auth and Hero Section"
Cohesion: 0.20
Nodes (10): AdminPage, LoginForm, useAdminAuth, AnimatedStat, HeroCarousel, HeroSection, useCounter, cache (module-level contenido cache) (+2 more)

### Community 20 - "Blog Admin and Tarjetas Actions"
Cohesion: 0.31
Nodes (10): BlogAdmin, BlogPage, ElBarrancoBanner, PROP_ID (El Barranco), BlogPost interface, supabase client, del (TarjetasEquipo), load (TarjetasEquipo) (+2 more)

### Community 21 - "SEO and Content Pages"
Cohesion: 0.24
Nodes (7): SEO(), SEOProps, setMeta helper, BlogPage(), SAMPLE_EQUIPO, VALORES, MiembroEquipo

### Community 22 - "Asociados and PropertyCard"
Cohesion: 0.28
Nodes (9): AsociadosPage, Asociado interface, Lang type, Propiedad interface, SAMPLE_ASOCIADOS, GRADIENTS (PropertyCard), PropertyCard, ETAPA_LABELS (+1 more)

### Community 23 - "SearchBar and Comunas Picker"
Cohesion: 0.25
Nodes (9): getComunas, DropSelect, handleSearch, Pill, PRECIOS options, RegionComunaPicker, REGIONES options (SearchBar local), SearchBar (+1 more)

### Community 24 - "Package Metadata"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, preview, type, version

### Community 25 - "Build Config Files"
Cohesion: 0.25
Nodes (3): include, include, references

### Community 26 - "tsconfig.node Compiler Options"
Cohesion: 0.33
Nodes (6): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck

### Community 27 - "ContactSection and Mensaje Type"
Cohesion: 0.50
Nodes (4): ContactSection, submit (ContactSection handler), MensajeContacto interface, CONTACT_INFO

### Community 28 - "Brand Image Assets"
Cohesion: 1.00
Nodes (4): SDM Favicon (SVG), SDM Capital Logo (logo-sdm.png), OG Image (Social Share Preview SVG), OG Image PNG (SDM Capital Social Share Preview)

## Ambiguous Edges - Review These
- `BlogPostPage.tsx` → `ficha_clientes table`  [AMBIGUOUS]
  src/pages/BlogPostPage.tsx · relation: shares_data_with
- `ElBarrancoShowcase.tsx` → `travel_guide table`  [AMBIGUOUS]
  supabase/migrations/travel_guide.sql · relation: semantically_similar_to
- `ImageUploader` → `PropiedadesAdmin`  [AMBIGUOUS]
  src/pages/AdminPage.tsx · relation: calls

## Knowledge Gaps
- **204 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+199 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `BlogPostPage.tsx` and `ficha_clientes table`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `ElBarrancoShowcase.tsx` and `travel_guide table`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `ImageUploader` and `PropiedadesAdmin`?**
  _Edge tagged AMBIGUOUS (relation: calls) - confidence is low._
- **Why does `PropiedadesAdmin` connect `Admin Property Forms and MapPicker` to `Cotizaciones Wizard Admin`, `Tarjeta Card Types and Markup`, `Admin Auth and Hero Section`, `Blog Admin and Tarjetas Actions`, `Asociados and PropertyCard`, `SearchBar and Comunas Picker`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `REGIONES` connect `Cotizaciones Wizard Admin` to `AdminPage Core Module`, `Admin Property Forms and MapPicker`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `supabase client` connect `Blog Admin and Tarjetas Actions` to `ContactSection and Mensaje Type`, `Admin Auth and Hero Section`, `Asociados and PropertyCard`, `Admin Property Forms and MapPicker`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _204 weakly-connected nodes found - possible documentation gaps or missing edges._