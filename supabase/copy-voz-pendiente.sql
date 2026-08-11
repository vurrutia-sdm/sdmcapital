-- Tanda 2 de la auditoría — la mitad que vive en `contenido_sitio`
--
-- NO ES UNA MIGRACIÓN Y NO DEBE MOVERSE A `supabase/migrations/`.
-- Vive acá justamente para que la CLI no lo recorra: es una edición de
-- contenido, no de esquema, y se corre a mano en el SQL Editor del dashboard.
--
-- POR QUÉ NO LO APLICÓ CLAUDE: `contenido_sitio` tiene RLS y niega la escritura
-- a la anon key, que es la única credencial disponible desde el repo.
-- Comprobado de forma concluyente escribiendo una clave existente con su MISMO
-- valor y `Prefer: return=representation`: devuelve `[]`, o sea que la fila
-- existe y la política la filtra.
--
--   (El primer intento devolvió 204 y NO probaba nada: usaba una clave
--   inexistente, así que ninguna fila coincidía. Es la misma trampa que
--   SINCRONIA.md documenta para DELETE — un 204 no prueba que se haya escrito.)
--
-- La otra mitad de la tanda 2 —11 correcciones— ya está aplicada en código.
-- Hasta que esto se corra, el sitio convive con dos redacciones de la política
-- de pagos: la canónica en las páginas de código, la vieja en las del CMS.
--
-- Autoridad: GUIA-DE-VOZ-SDM.md §8 (política canónica), §5 (CTAs), §7 (cifras).
-- Hallazgos: AUDITORIA-VOZ-SDM.md A1, A2, M3, B4.

begin;

-- ─── A2 · La política de pagos, en su redacción canónica (guía §8) ───────────
-- Hoy el sitio la enuncia de cinco formas. Ésta es la única admitida en el
-- espacio largo; «Sin pagos adelantados.» y «Sin pagos adelantados. La gestión
-- es gratis si compras con SDM.» son las versiones corta y media admitidas.
-- «Sin cobros anticipados» queda PROHIBIDA como variante.

update contenido_sitio set valor =
  'Sin pagos adelantados. La gestión de financiamiento no tiene costo si compras con SDM. Si la compra la haces por fuera, la gestión sí se cobra, y solo cuando el crédito está aprobado.'
 where clave = 'financiamiento_condicion';

-- El cuerpo del bloque no repite la política entera —la condición va justo
-- debajo—, pero sí pierde el «pre» del trámite (ver abajo).
update contenido_sitio set valor =
  'Hacemos la evaluación hipotecaria y te acompañamos en todo el proceso. Sin pagos adelantados.'
 where clave = 'financiamiento_body';

update contenido_sitio set valor =
  'Gestión de crédito hipotecario y consumo para personas naturales. Sin pagos adelantados.'
 where clave = 'servicio_fin_per_desc';
-- ↑ sin cambio de texto: ya usa la forma corta correcta. Se deja el UPDATE para
--   que quede constancia de que se revisó y no de que se olvidó.

-- ─── A1 · Los 20 años son de Roberto. La empresa lleva 15. ───────────────────
-- `PRODUCT.md` lo fija: 15 años de trayectoria de SDM Capital (cifra aprobada),
-- +20 años de Roberto Urrutia en banca. Rental atribuía los 20 a la empresa.

update contenido_sitio set valor =
  'Un equipo que viene de la banca'
 where clave = 'rental_quienes_titulo';

update contenido_sitio set valor =
  'SDM Capital lleva 15 años en el mercado inmobiliario, y Roberto Urrutia, su Director Comercial, más de 20 en banca. Administramos tu propiedad con respaldo legal en cada operación y la difundimos en los portales donde los arrendatarios buscan.'
 where clave = 'rental_quienes_somos';
-- ↑ además salen «soluciones adaptadas» (guía §6, «soluciones») y «red de
--   marketing digital», que no dice qué se hace.

-- ─── Nombre del trámite: sin «pre» ──────────────────────────────────────────
-- La página de destino se llama /evaluacion-gratuita. Con esto el nombre y el
-- destino coinciden por primera vez. Resuelve B4 (dos nombres para lo mismo).

update contenido_sitio set valor =
  'Solicita tu evaluación gratuita'
 where clave = 'financiamiento_cta';

-- ─── M3 · Sin flecha escrita dentro del copy (guía §5, v1.1) ────────────────
-- `banner_cta_texto` no la lleva hoy, pero se normaliza junto al resto para que
-- quede una sola pasada sobre los CTA del CMS.
update contenido_sitio set valor = replace(valor, ' →', '')
 where clave in ('banner_cta_texto', 'financiamiento_cta')
   and valor like '%→%';

-- ─── Comprobación antes de confirmar ────────────────────────────────────────
select clave, valor from contenido_sitio
 where clave in ('financiamiento_body','financiamiento_condicion','servicio_fin_per_desc',
                 'rental_quienes_titulo','rental_quienes_somos','financiamiento_cta','banner_cta_texto')
 order by clave;

-- Si las siete filas se ven bien:
commit;
-- Si algo no cuadra:  rollback;

-- ─── DESPUÉS DE CORRER ESTO ─────────────────────────────────────────────────
-- La semilla de `index.html` es de la hora del build, así que hasta el
-- siguiente deploy el primer pintado mostrará el texto viejo y la consulta en
-- vivo lo corregirá — el parpadeo que documenta `scripts/sync-contenido-seed.mjs`.
-- Un deploy lo resincroniza.
