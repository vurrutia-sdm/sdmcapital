import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  optimizeDeps: {
    include: ['@react-pdf/renderer'],
  },
  build: {
    rollupOptions: {
      output: {
        // Separa las dependencias que cambian poco de las que cambian en cada
        // deploy: así un cambio en el sitio no invalida la caché de React ni la
        // del editor. Solo se listan las grandes; el resto de node_modules va
        // al chunk que lo importa, que es donde rollup ya lo pone bien.
        manualChunks(id) {
          // El helper __vitePreload no vive en node_modules y rollup lo deja
          // en el primer chunk que le toque. Si cae en `pdf`, el entry lo
          // importa desde ahí y el sitio público se descarga los 2 MB del
          // generador de PDF sin usarlos. Se ancla a un chunk que igual carga.
          if (id.includes('vite/preload-helper')) return 'react'
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
          if (id.includes('react-router')) return 'router'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'editor'
          if (id.includes('@react-pdf') || id.includes('jspdf') || id.includes('html2canvas')) return 'pdf'
          if (id.includes('lucide-react')) return 'iconos'
        },
      },
    },
  },
})
