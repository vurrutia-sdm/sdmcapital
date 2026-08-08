// Pestaña "Barranco" del admin — showcase del Hotel El Barranco (tabla
// `showcase_barranco`), con todos los textos en EN/ES.
//
// Extraída de AdminPage.tsx sin cambios de comportamiento: mismos estilos,
// mismas queries. Los emojis pasaron a iconos de lucide-react más tarde. La clave de pestaña sigue siendo 'barranco' — el orden de las
// pestañas se persiste en localStorage y renombrarla borraría esa preferencia.

import { useState, useEffect } from 'react'
import { BarChart3, Bed, BookOpen, Building2, Clapperboard, ClipboardList, Image, Lightbulb, Wallet, Waves, Wind } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import { Sec, Full } from '@/components/admin/layout'
import { Field, Inp, Txa } from '@/components/admin/campos'
import { SaveBtn, Guardado } from '@/components/admin/acciones'
import { ImageUploader } from '@/components/admin/ImageUploader'

export default function Barranco() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [d, setD] = useState<Record<string, string>>({
    // ── Hero ──
    hero_titulo: 'Hotel El Barranco',
    hero_subtitulo: 'Where the river meets the mountains', hero_subtitulo_es: '',
    hero_tagline: "A fully operational boutique hotel and restaurant with 25 years of history, positioned at the gateway to one of the world's premier adventure destinations. Offered turnkey — ready to continue, ready to grow.",
    hero_tagline_es: '',
    banner_foto: '', banner_detalle_foto: '', destination_foto: '',
    hero_img_1: '', hero_img_2: '', hero_img_3: '', hero_img_4: '',
    // ── Destination ──
    destination_p1: 'Nested deep within Chilean Patagonia, Futaleufú is a name whispered among adventurers across the globe. Its river — a torrent of glacial turquoise — carries Class V+ rapids through valleys of impossible beauty. The kind of place that changes people.',
    destination_p1_es: '',
    destination_p2: 'El Barranco has welcomed guests at the center of it all for over two decades. Anglers from Montana, kayakers from Europe, families discovering Patagonia for the first time. The destination does the marketing. The hotel delivers the experience.',
    destination_p2_es: '',
    dest_eyebrow: 'The Destination', dest_eyebrow_es: '',
    dest_titulo: 'Futaleufú — A world unto itself', dest_titulo_es: '',
    dest_stat1_num: '25+', dest_stat1_label: 'Years in operation',
    dest_stat2_num: 'Class V+', dest_stat2_label: 'River rating',
    dest_stat3_num: '10', dest_stat3_label: 'Hotel rooms',
    dest_stat_1_label: 'Years in operation', dest_stat_1_label_es: '',
    dest_stat_2_label: 'River rating', dest_stat_2_label_es: '',
    dest_stat_3_label: 'Hotel rooms', dest_stat_3_label_es: '',
    // ── Activities ──
    act_1_img: '', actividad_1_titulo: 'Whitewater Rafting', actividad_1_titulo_es: '', actividad_1_sub: 'Class V+ · Río Futaleufú', actividad_1_sub_es: '',
    act_2_img: '', actividad_2_titulo: 'Fly Fishing',         actividad_2_titulo_es: '', actividad_2_sub: 'World-class trout · Patagonia', actividad_2_sub_es: '',
    act_3_img: '', actividad_3_titulo: 'Trekking & Riding',   actividad_3_titulo_es: '', actividad_3_sub: 'Valle Las Escalas · Glaciers',  actividad_3_sub_es: '',
    exp_eyebrow: 'The Experience', exp_eyebrow_es: '',
    exp_titulo: 'Adventures at your doorstep', exp_titulo_es: '',
    act_p: "Beyond the river: guided fly fishing on Lago Lonconao and Río Espolón, family floating, horseback riding through Valle Las Escalas, trekking to hidden glacier lakes, and kayaking across Patagonia's most pristine waterways.",
    act_p_es: '',
    // ── Property ──
    prop_eyebrow: 'The Property', prop_eyebrow_es: '',
    prop_titulo: 'Rooms, Restaurant & Amenities', prop_titulo_es: '',
    propiedad_desc: 'Designed in mountain architecture, El Barranco offers 10 fully equipped rooms — each approximately 24 m² with en-suite bathroom — alongside a 40-seat restaurant rooted in Patagonian cuisine. Lamb, trout, regional produce. The kind of table guests remember.',
    propiedad_desc_es: '',
    prop_foto1: '', prop_foto2: '', prop_foto3: '', prop_foto4: '',
    // ── Amenidades ──
    amenidad_1_titulo: '10 Rooms',         amenidad_1_titulo_es: '', amenidad_1_desc: '24 m² each, en-suite, fully furnished',          amenidad_1_desc_es: '',
    amenidad_2_titulo: 'Restaurant',       amenidad_2_titulo_es: '', amenidad_2_desc: '40 covers, full bar, liquor license',             amenidad_2_desc_es: '',
    amenidad_3_titulo: 'Wellness',         amenidad_3_titulo_es: '', amenidad_3_desc: 'Pool 5×7, sauna, massage room',                   amenidad_3_desc_es: '',
    amenidad_4_titulo: 'Residence',        amenidad_4_titulo_es: '', amenidad_4_desc: "Separate 2BD/2BA owner's house + office",         amenidad_4_desc_es: '',
    amenidad_5_titulo: 'Infrastructure',   amenidad_5_titulo_es: '', amenidad_5_desc: '17kW generator, pellet boiler, laundry',          amenidad_5_desc_es: '',
    amenidad_6_titulo: 'Parking',          amenidad_6_titulo_es: '', amenidad_6_desc: '5 vehicle capacity on-site',                      amenidad_6_desc_es: '',
    amenidad_7_titulo: 'Turnkey Sale',     amenidad_7_titulo_es: '', amenidad_7_desc: 'All furniture & equipment included',              amenidad_7_desc_es: '',
    amenidad_8_titulo: 'Registered Brand', amenidad_8_titulo_es: '', amenidad_8_desc: 'El Barranco — INAPI certified',                   amenidad_8_desc_es: '',
    // ── Investment Brief — The Story ──
    story_p1: "A business that runs itself for half the year — imagine what you could do with the other half.", story_p1_es: '',
    story_p2: "El Barranco currently operates only during peak season (6 months) due to the health of its current owners. The infrastructure is complete, the brand is established, the market is ready. A new operator stepping in with full-year ambition faces no capital expenditure barrier — only upside.", story_p2_es: '',
    story_p3: "Futaleufú's position as a year-round destination is growing. Winter fly fishing, wellness retreats, and off-season adventure travel represent untapped revenue lines that the existing installation can absorb immediately.", story_p3_es: '',
    opp_eyebrow: 'The Opportunity', opp_eyebrow_es: '',
    opp_titulo: 'An asset built to scale', opp_titulo_es: '',
    opp_tab_story: 'The Story', opp_tab_story_es: '',
    opp_tab_brief: 'Investment Brief', opp_tab_brief_es: '',
    brief_precio: 'USD 3M', brief_revenue: '$181M', brief_meses: '6 → 12', brief_guests: '1,975', brief_terreno: '1,100 m²',
    brief_note1: 'UF 68,000 — all assets, inventory, brand & IP included',
    brief_note2: '2022 — operating only 6 months of the year',
    brief_note3: 'Current vs. full-year potential with no additional capex',
    brief_note4: '2022 — from a 10-room boutique hotel',
    brief_note5: '650 m² built · established 2000 · north orientation',
    brief_note6: 'SDM Capital Real Estate · +56 9 3103 8954',
    brief_upside_titulo: 'The growth path is clear', brief_upside_titulo_es: '',
    brief_upside_texto: 'Extend operations to 8–12 months · Develop winter and wellness programming · Partner with international adventure operators already active in the region · Leverage 25 years of brand equity and an established digital presence.', brief_upside_texto_es: '',
    brief_legal_titulo: 'Legal standing', brief_legal_titulo_es: '',
    brief_legal_texto: 'Property documentation current · Active commercial restaurant license (including spirits) · Hotel operating license · INAPI registered brand · Tax ID Rol 33-006 · Minor areas pending regularization: massage room, sauna, laundry (standard process, no operational impact). Staff of 6–7 available to continue with new ownership.', brief_legal_texto_es: '',
    // ── Ficha Técnica — Infrastructure (7 filas) ──
    ficha_infra_1_key: 'Land area',           ficha_infra_1_key_es: '', ficha_infra_1_val: '1,100 m²',                   ficha_infra_1_val_es: '',
    ficha_infra_2_key: 'Built area',          ficha_infra_2_key_es: '', ficha_infra_2_val: '~650 m²',                    ficha_infra_2_val_es: '',
    ficha_infra_3_key: 'Year built',          ficha_infra_3_key_es: '', ficha_infra_3_val: '2000',                       ficha_infra_3_val_es: '',
    ficha_infra_4_key: 'Orientation',         ficha_infra_4_key_es: '', ficha_infra_4_val: 'North',                      ficha_infra_4_val_es: '',
    ficha_infra_5_key: 'Rooms',               ficha_infra_5_key_es: '', ficha_infra_5_val: '10 (24 m² + en-suite each)', ficha_infra_5_val_es: '',
    ficha_infra_6_key: 'Restaurant capacity', ficha_infra_6_key_es: '', ficha_infra_6_val: '40 guests',                  ficha_infra_6_val_es: '',
    ficha_infra_7_key: 'Pool',                ficha_infra_7_key_es: '', ficha_infra_7_val: '5 × 7 m',                   ficha_infra_7_val_es: '',
    // ── Ficha Técnica — Equipment (7 filas) ──
    ficha_equip_1_key: 'Kitchen',      ficha_equip_1_key_es: '', ficha_equip_1_val: 'Industrial ovens, range, blast chiller', ficha_equip_1_val_es: '',
    ficha_equip_2_key: 'Cold storage', ficha_equip_2_key_es: '', ficha_equip_2_val: 'Walk-in fridges & freezers',             ficha_equip_2_val_es: '',
    ficha_equip_3_key: 'Dishwashing',  ficha_equip_3_key_es: '', ficha_equip_3_val: 'Industrial dishwasher + dough mixer',    ficha_equip_3_val_es: '',
    ficha_equip_4_key: 'Laundry',      ficha_equip_4_key_es: '', ficha_equip_4_val: 'Washers, dryer, industrial press',       ficha_equip_4_val_es: '',
    ficha_equip_5_key: 'Energy',       ficha_equip_5_key_es: '', ficha_equip_5_val: 'Pellet boiler + 17kW generator',         ficha_equip_5_val_es: '',
    ficha_equip_6_key: 'Amenities',    ficha_equip_6_key_es: '', ficha_equip_6_val: 'Pool equipment, sauna, massage room',    ficha_equip_6_val_es: '',
    ficha_equip_7_key: 'Furniture',    ficha_equip_7_key_es: '', ficha_equip_7_val: 'All rooms, restaurant, common areas',    ficha_equip_7_val_es: '',
    // ── Ficha Técnica — Legal (6 filas) ──
    ficha_legal_1_key: 'Title deed',          ficha_legal_1_key_es: '', ficha_legal_1_val: 'Current',                      ficha_legal_1_val_es: '',
    ficha_legal_2_key: 'Restaurant license',  ficha_legal_2_key_es: '', ficha_legal_2_val: 'Active (incl. spirits)',         ficha_legal_2_val_es: '',
    ficha_legal_3_key: 'Hotel license',       ficha_legal_3_key_es: '', ficha_legal_3_val: 'Active',                        ficha_legal_3_val_es: '',
    ficha_legal_4_key: 'Brand registration',  ficha_legal_4_key_es: '', ficha_legal_4_val: 'INAPI — El Barranco',            ficha_legal_4_val_es: '',
    ficha_legal_5_key: 'Tax ID (Rol)',         ficha_legal_5_key_es: '', ficha_legal_5_val: '33-006',                        ficha_legal_5_val_es: '',
    ficha_legal_6_key: 'Address',             ficha_legal_6_key_es: '', ficha_legal_6_val: "B. O'Higgins 172, Futaleufú",   ficha_legal_6_val_es: '',
    // ── Ficha Técnica — Operations (6 filas) ──
    ficha_ops_1_key: 'Current season',    ficha_ops_1_key_es: '', ficha_ops_1_val: '6 months/year (peak)',         ficha_ops_1_val_es: '',
    ficha_ops_2_key: 'Potential season',  ficha_ops_2_key_es: '', ficha_ops_2_val: '8–12 months/year',             ficha_ops_2_val_es: '',
    ficha_ops_3_key: 'Staff',             ficha_ops_3_key_es: '', ficha_ops_3_val: '6–7 people',                   ficha_ops_3_val_es: '',
    ficha_ops_4_key: 'Sale type',         ficha_ops_4_key_es: '', ficha_ops_4_val: 'Turnkey — immediate takeover', ficha_ops_4_val_es: '',
    ficha_ops_5_key: "Owner's residence", ficha_ops_5_key_es: '', ficha_ops_5_val: 'Separate 2BD/2BA house',       ficha_ops_5_val_es: '',
    ficha_ops_6_key: 'Asking price',      ficha_ops_6_key_es: '', ficha_ops_6_val: 'UF 68,000 (~USD 3,000,000)',  ficha_ops_6_val_es: '',
    // ── Gallery ──
    details_eyebrow: 'Property Details', details_eyebrow_es: '',
    details_titulo: 'Technical overview', details_titulo_es: '',
    details_tab_infra: 'Infrastructure', details_tab_infra_es: '',
    details_tab_equip: 'Equipment Included', details_tab_equip_es: '',
    details_tab_legal: 'Legal', details_tab_legal_es: '',
    details_tab_ops: 'Operations', details_tab_ops_es: '',
    gallery_eyebrow: 'Gallery', gallery_eyebrow_es: '',
    gallery_titulo: 'The property in images', gallery_titulo_es: '',
    gallery_1: '', gallery_2: '', gallery_3: '', gallery_4: '',
    gallery_5: '', gallery_6: '', gallery_7: '',
    // ── Contact ──
    contact_eyebrow: 'Exclusive Listing', contact_eyebrow_es: '',
    contact_titulo: 'Begin your conversation', contact_titulo_es: '',
    precio_display: 'USD 3,000,000',
    precio_sub: 'UF 68,000 · Turnkey · Futaleufú, Chile', precio_sub_es: '',
    contacto_parrafo: 'Boutique hospitality assets with validated operations, a registered brand, and full infrastructure in world-class adventure destinations do not come to market often.', contacto_parrafo_es: '',
    contacto_telefono: '+56 9 3103 8954',
    contacto_empresa: 'SDM Capital Real Estate',
  })

  const set = (k: string) => (v: string) => setD(prev => ({ ...prev, [k]: v }))

  useEffect(() => {
    supabase.from('showcase_barranco').select('clave, valor').then(({ data }) => {
      if (data) {
        const loaded: Record<string, string> = {}
        data.forEach(({ clave, valor }: { clave: string; valor: string }) => { loaded[clave] = valor })
        setD(prev => ({ ...prev, ...loaded }))
      }
    })
  }, [])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('showcase_barranco').upsert(
      Object.entries(d).map(([clave, valor]) => ({ clave, valor })),
      { onConflict: 'clave' }
    )
    setSaving(false)
    if (avisarError('No se pudo guardar el showcase', error)) return
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }


  // Render helpers — EN 🇬🇧 / ES 🇨🇱 side by side
  const bi = (keyEn: string, keyEs: string, label: string) => (
    <>
      <Field label={`${label} EN 🇬🇧`}><Inp value={d[keyEn] ?? ''} onChange={set(keyEn)} /></Field>
      <Field label={`${label} ES 🇨🇱`}><Inp value={d[keyEs] ?? ''} onChange={set(keyEs)} placeholder="Vacío = usa EN" /></Field>
    </>
  )
  const biTxa = (keyEn: string, keyEs: string, label: string, rows = 3) => (
    <>
      <Full><Field label={`${label} EN 🇬🇧`}><Txa rows={rows} value={d[keyEn] ?? ''} onChange={set(keyEn)} /></Field></Full>
      <Full><Field label={`${label} ES 🇨🇱`}><Txa rows={rows} value={d[keyEs] ?? ''} onChange={set(keyEs)} placeholder="Vacío = usa EN" /></Field></Full>
    </>
  )

  return (
    <div>
      <div className="flex flex-col items-start gap-3 mb-6 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
        <h2 className="font-serif font-light flex items-center gap-2 text-sdm-display-sm" style={{ color: 'var(--navy-dark)' }}><Building2 size={18} strokeWidth={1.75} />El Barranco — Showcase</h2>
        <div className="flex items-center gap-4">
          <Guardado visible={saved} />
          <SaveBtn onClick={save} loading={saving} />
        </div>
      </div>

      {/* ── Hero ── */}
      <Sec title={<><Clapperboard size={18} strokeWidth={1.75} />Hero</>}>
        <Field label="Título (igual EN/ES)"><Inp value={d.hero_titulo} onChange={set('hero_titulo')} /></Field>
        <div />
        {bi('hero_subtitulo', 'hero_subtitulo_es', 'Subtítulo')}
        {biTxa('hero_tagline', 'hero_tagline_es', 'Tagline / descripción')}
        <Full><Field label="Foto sección Destino">
          <ImageUploader currentUrl={d.destination_foto} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, destination_foto: url }))} />
        </Field></Full>
        <Full><Field label="Foto banner principal (showcase)">
          <ImageUploader currentUrl={d.banner_foto} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, banner_foto: url }))} />
        </Field></Full>
        <Full><Field label="Foto banner en página de propiedad">
          <ImageUploader currentUrl={d.banner_detalle_foto} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, banner_detalle_foto: url }))} />
        </Field></Full>
      </Sec>

      {/* ── Carousel ── */}
      <Sec title={<><Image size={18} strokeWidth={1.75} />Carousel Hero (4 fotos)</>}>
        {(['hero_img_1', 'hero_img_2', 'hero_img_3', 'hero_img_4'] as const).map((k, i) => (
          <Full key={k}><Field label={`Foto carousel ${i + 1}`}>
            <ImageUploader currentUrl={d[k]} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, [k]: url }))} />
          </Field></Full>
        ))}
      </Sec>

      {/* ── Destino ── */}
      <Sec title={<><Waves size={18} strokeWidth={1.75} />Sección Destino</>}>
        {bi('dest_eyebrow', 'dest_eyebrow_es', 'Eyebrow / kicker')}
        {bi('dest_titulo', 'dest_titulo_es', 'Título de sección')}
        {biTxa('destination_p1', 'destination_p1_es', 'Párrafo 1')}
        {biTxa('destination_p2', 'destination_p2_es', 'Párrafo 2')}
        <Field label="Stat 1 — Número"><Inp value={d.dest_stat1_num}   onChange={set('dest_stat1_num')}   placeholder="25+" /></Field>
        <div />
        {bi('dest_stat_1_label', 'dest_stat_1_label_es', 'Stat 1 — Etiqueta')}
        <Field label="Stat 2 — Número"><Inp value={d.dest_stat2_num}   onChange={set('dest_stat2_num')}   placeholder="Class V+" /></Field>
        <div />
        {bi('dest_stat_2_label', 'dest_stat_2_label_es', 'Stat 2 — Etiqueta')}
        <Field label="Stat 3 — Número"><Inp value={d.dest_stat3_num}   onChange={set('dest_stat3_num')}   placeholder="10" /></Field>
        <div />
        {bi('dest_stat_3_label', 'dest_stat_3_label_es', 'Stat 3 — Etiqueta')}
      </Sec>

      {/* ── Actividades ── */}
      <Sec title={<><Wind size={18} strokeWidth={1.75} />Actividades (3 cards)</>}>
        {bi('exp_eyebrow', 'exp_eyebrow_es', 'Eyebrow / kicker')}
        {bi('exp_titulo', 'exp_titulo_es', 'Título de sección')}
        {([1, 2, 3] as const).map(n => (
          <Full key={n}>
            <div className="bg-[var(--off)]" style={{ borderRadius: 4, padding: '16px 20px', marginBottom: 4 }}>
              <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 600, textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 12 }}>Actividad {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bi(`actividad_${n}_titulo`, `actividad_${n}_titulo_es`, 'Título')}
                {bi(`actividad_${n}_sub`, `actividad_${n}_sub_es`, 'Subtítulo')}
                <Full><Field label="Foto">
                  <ImageUploader currentUrl={d[`act_${n}_img`]} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, [`act_${n}_img`]: url }))} />
                </Field></Full>
              </div>
            </div>
          </Full>
        ))}
        {biTxa('act_p', 'act_p_es', "Párrafo 'Beyond the river'")}
      </Sec>

      {/* ── La Propiedad ── */}
      <Sec title={<><Building2 size={18} strokeWidth={1.75} />La Propiedad</>}>
        {bi('prop_eyebrow', 'prop_eyebrow_es', 'Eyebrow / kicker')}
        {bi('prop_titulo', 'prop_titulo_es', 'Título de sección')}
        {biTxa('propiedad_desc', 'propiedad_desc_es', 'Descripción introductoria', 4)}
        {(['prop_foto1', 'prop_foto2', 'prop_foto3', 'prop_foto4'] as const).map((k, i) => (
          <Full key={k}><Field label={`Foto propiedad ${i + 1} (grid 2×2)`}>
            <ImageUploader currentUrl={d[k]} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, [k]: url }))} />
          </Field></Full>
        ))}
      </Sec>

      {/* ── Amenidades ── */}
      <Sec title={<><Bed size={18} strokeWidth={1.75} />Amenidades (8 cards)</>}>
        {([1, 2, 3, 4, 5, 6, 7, 8] as const).map(n => (
          <Full key={n}>
            <div className="bg-[var(--off)]" style={{ borderRadius: 4, padding: '14px 18px', marginBottom: 4 }}>
              <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 600, textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 10 }}>Amenidad {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bi(`amenidad_${n}_titulo`, `amenidad_${n}_titulo_es`, 'Título')}
                {bi(`amenidad_${n}_desc`, `amenidad_${n}_desc_es`, 'Descripción')}
              </div>
            </div>
          </Full>
        ))}
      </Sec>

      {/* ── La Oportunidad ── */}
      <Sec title={<><Lightbulb size={18} strokeWidth={1.75} />La Oportunidad — Encabezado y tabs</>}>
        {bi('opp_eyebrow', 'opp_eyebrow_es', 'Eyebrow / kicker')}
        {bi('opp_titulo', 'opp_titulo_es', 'Título de sección')}
        {bi('opp_tab_story', 'opp_tab_story_es', 'Tab — The Story')}
        {bi('opp_tab_brief', 'opp_tab_brief_es', 'Tab — Investment Brief')}
      </Sec>

      {/* ── Investment Brief — Números ── */}
      <Sec title={<><BarChart3 size={18} strokeWidth={1.75} />Investment Brief — Números</>}>
        <Field label="Precio (num grande)"><Inp value={d.brief_precio}  onChange={set('brief_precio')}  placeholder="USD 3M" /></Field>
        <Field label="Revenue peak (CLP)"><Inp value={d.brief_revenue} onChange={set('brief_revenue')} placeholder="$181M" /></Field>
        <Field label="Meses operación"><Inp   value={d.brief_meses}   onChange={set('brief_meses')}   placeholder="6 → 12" /></Field>
        <Field label="Huéspedes mejor año"><Inp value={d.brief_guests} onChange={set('brief_guests')} placeholder="1,975" /></Field>
        <Field label="Terreno total"><Inp       value={d.brief_terreno} onChange={set('brief_terreno')} placeholder="1,100 m²" /></Field>
        <div />
        <Field label="Nota card 1 (precio)"><Inp     value={d.brief_note1} onChange={set('brief_note1')} /></Field>
        <Field label="Nota card 2 (revenue)"><Inp    value={d.brief_note2} onChange={set('brief_note2')} /></Field>
        <Field label="Nota card 3 (meses)"><Inp      value={d.brief_note3} onChange={set('brief_note3')} /></Field>
        <Field label="Nota card 4 (huéspedes)"><Inp  value={d.brief_note4} onChange={set('brief_note4')} /></Field>
        <Field label="Nota card 5 (terreno)"><Inp    value={d.brief_note5} onChange={set('brief_note5')} /></Field>
        <Field label="Nota card 6 (comisión)"><Inp   value={d.brief_note6} onChange={set('brief_note6')} /></Field>
        {bi('brief_upside_titulo', 'brief_upside_titulo_es', 'Upside box — título')}
        {biTxa('brief_upside_texto', 'brief_upside_texto_es', 'Upside box — texto')}
        {bi('brief_legal_titulo', 'brief_legal_titulo_es', 'Legal standing — título')}
        {biTxa('brief_legal_texto', 'brief_legal_texto_es', 'Legal standing — texto', 4)}
      </Sec>

      {/* ── The Story ── */}
      <Sec title={<><BookOpen size={18} strokeWidth={1.75} />The Story</>}>
        {biTxa('story_p1', 'story_p1_es', 'Párrafo 1 (azul destacado)', 3)}
        {biTxa('story_p2', 'story_p2_es', 'Párrafo 2', 4)}
        {biTxa('story_p3', 'story_p3_es', 'Párrafo 3', 4)}
      </Sec>

      {/* ── Property Details — Encabezado y tabs ── */}
      <Sec title={<><ClipboardList size={18} strokeWidth={1.75} />Property Details — Encabezado y tabs</>}>
        {bi('details_eyebrow', 'details_eyebrow_es', 'Eyebrow / kicker')}
        {bi('details_titulo', 'details_titulo_es', 'Título de sección')}
        {bi('details_tab_infra', 'details_tab_infra_es', 'Tab — Infrastructure')}
        {bi('details_tab_equip', 'details_tab_equip_es', 'Tab — Equipment')}
        {bi('details_tab_legal', 'details_tab_legal_es', 'Tab — Legal')}
        {bi('details_tab_ops', 'details_tab_ops_es', 'Tab — Operations')}
      </Sec>

      {/* ── Ficha Técnica — Infrastructure ── */}
      <Sec title={<><ClipboardList size={18} strokeWidth={1.75} />Ficha — Infrastructure (7 filas)</>}>
        {([1,2,3,4,5,6,7] as const).map(n => (
          <Full key={n}>
            <div className="bg-[var(--off)]" style={{ borderRadius: 4, padding: '12px 16px', marginBottom: 4 }}>
              <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Fila {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bi(`ficha_infra_${n}_key`, `ficha_infra_${n}_key_es`, 'Etiqueta')}
                {bi(`ficha_infra_${n}_val`, `ficha_infra_${n}_val_es`, 'Valor')}
              </div>
            </div>
          </Full>
        ))}
      </Sec>

      {/* ── Ficha Técnica — Equipment ── */}
      <Sec title={<><ClipboardList size={18} strokeWidth={1.75} />Ficha — Equipment Included (7 filas)</>}>
        {([1,2,3,4,5,6,7] as const).map(n => (
          <Full key={n}>
            <div className="bg-[var(--off)]" style={{ borderRadius: 4, padding: '12px 16px', marginBottom: 4 }}>
              <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Fila {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bi(`ficha_equip_${n}_key`, `ficha_equip_${n}_key_es`, 'Etiqueta')}
                {bi(`ficha_equip_${n}_val`, `ficha_equip_${n}_val_es`, 'Valor')}
              </div>
            </div>
          </Full>
        ))}
      </Sec>

      {/* ── Ficha Técnica — Legal ── */}
      <Sec title={<><ClipboardList size={18} strokeWidth={1.75} />Ficha — Legal (6 filas)</>}>
        {([1,2,3,4,5,6] as const).map(n => (
          <Full key={n}>
            <div className="bg-[var(--off)]" style={{ borderRadius: 4, padding: '12px 16px', marginBottom: 4 }}>
              <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Fila {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bi(`ficha_legal_${n}_key`, `ficha_legal_${n}_key_es`, 'Etiqueta')}
                {bi(`ficha_legal_${n}_val`, `ficha_legal_${n}_val_es`, 'Valor')}
              </div>
            </div>
          </Full>
        ))}
      </Sec>

      {/* ── Ficha Técnica — Operations ── */}
      <Sec title={<><ClipboardList size={18} strokeWidth={1.75} />Ficha — Operations (6 filas)</>}>
        {([1,2,3,4,5,6] as const).map(n => (
          <Full key={n}>
            <div className="bg-[var(--off)]" style={{ borderRadius: 4, padding: '12px 16px', marginBottom: 4 }}>
              <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Fila {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bi(`ficha_ops_${n}_key`, `ficha_ops_${n}_key_es`, 'Etiqueta')}
                {bi(`ficha_ops_${n}_val`, `ficha_ops_${n}_val_es`, 'Valor')}
              </div>
            </div>
          </Full>
        ))}
      </Sec>

      {/* ── Gallery ── */}
      <Sec title={<><Image size={18} strokeWidth={1.75} />Galería (7 fotos)</>}>
        {bi('gallery_eyebrow', 'gallery_eyebrow_es', 'Eyebrow / kicker')}
        {bi('gallery_titulo', 'gallery_titulo_es', 'Título de sección')}
        <Full><Field label="Foto 1 — grande 2×2 (izquierda)">
          <ImageUploader currentUrl={d.gallery_1} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, gallery_1: url }))} />
        </Field></Full>
        {(['gallery_2', 'gallery_3', 'gallery_4', 'gallery_5', 'gallery_6', 'gallery_7'] as const).map((k, i) => (
          <Full key={k}><Field label={`Foto ${i + 2}`}>
            <ImageUploader currentUrl={d[k]} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, [k]: url }))} />
          </Field></Full>
        ))}
      </Sec>

      {/* ── Contacto ── */}
      <Sec title={<><Wallet size={18} strokeWidth={1.75} />Contacto — Precio y datos</>}>
        {bi('contact_eyebrow', 'contact_eyebrow_es', 'Eyebrow / kicker')}
        {bi('contact_titulo', 'contact_titulo_es', 'Título de sección')}
        <Field label="Precio principal (grande, sin traducir)"><Inp value={d.precio_display} onChange={set('precio_display')} placeholder="USD 3,000,000" /></Field>
        <div />
        {bi('precio_sub', 'precio_sub_es', 'Precio subtexto')}
        {biTxa('contacto_parrafo', 'contacto_parrafo_es', 'Párrafo descriptivo')}
        <Field label="Teléfono"><Inp value={d.contacto_telefono} onChange={set('contacto_telefono')} /></Field>
        <Field label="Nombre empresa"><Inp value={d.contacto_empresa} onChange={set('contacto_empresa')} /></Field>
      </Sec>

      <div className="flex justify-end mt-4">
        <SaveBtn onClick={save} loading={saving} />
      </div>
    </div>
  )
}
