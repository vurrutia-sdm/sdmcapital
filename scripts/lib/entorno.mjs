// Lectura de .env para los scripts de build.
//
// Vive acá porque la usan sync-hero-preload.mjs y sync-contenido-seed.mjs, y
// dos copias de esto se desincronizan sin que nadie se entere: son doce líneas
// que parecen obvias hasta que una de las dos deja de recortar las comillas.
import fs from 'node:fs'
import path from 'node:path'

const RAIZ = path.resolve(import.meta.dirname, '..', '..')

export function leerEnv() {
  // Los archivos primero y process.env encima: las variables de entorno mandan,
  // que es lo convencional y lo que permite sobrescribir en CI o en pruebas.
  const env = {}
  for (const archivo of ['.env', '.env.local']) {
    const p = path.join(RAIZ, archivo)
    if (!fs.existsSync(p)) continue
    for (const linea of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return { ...env, ...process.env }
}
