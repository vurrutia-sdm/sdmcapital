/* Solo las dos reglas de hooks. No es un linter general del proyecto:
   el estilo lo gobierna `tsc` y la revisión humana. Añadir reglas acá
   convierte cada build en una discusión de formato. */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  // `@typescript-eslint` va registrado pero con TODAS sus reglas apagadas: hace
  // falta solo para que el `eslint-disable-next-line
  // @typescript-eslint/no-unused-vars` que ya existe en CotizacionesAdmin.tsx
  // resuelva. Un disable que apunta a una regla no definida es un error de
  // ESLint por sí mismo.
  plugins: ['react-hooks', '@typescript-eslint'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
  },
}
