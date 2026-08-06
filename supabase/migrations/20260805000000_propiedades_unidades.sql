-- Agrega `unidades` a propiedades.
--
-- Un edificio de oficinas en arriendo no es una unidad: es un conjunto de pisos
-- disponibles, cada uno con su superficie. Hasta ahora el catálogo solo sabía
-- representar `superficie_total`, que en estos casos es la suma de los pisos y
-- no dice nada de lo que efectivamente se arrienda.
--
-- Forma del JSONB — array de objetos:
--
--   [{ "piso": "3", "m2": 461 }, { "piso": "20", "m2": null,
--     "nota": "superficie por confirmar" }]
--
-- `m2` nullable a propósito: hay unidades cuya superficie todavía no está
-- verificada, y es preferible mostrarlas como pendientes antes que inventar
-- el dato o esconder la unidad.
--
-- Nullable a nivel de columna: la enorme mayoría de las propiedades (casas,
-- departamentos, parcelas) no se subdivide en unidades y debe quedar en NULL,
-- que es lo que el render usa para no dibujar la tabla.

ALTER TABLE propiedades ADD COLUMN IF NOT EXISTS unidades jsonb;

-- PostgREST cachea el esquema: sin recargarlo, un INSERT con `unidades` puede
-- responder 400 (PGRST204) por unos minutos aunque la columna ya exista.
NOTIFY pgrst, 'reload schema';
