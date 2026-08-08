import { ChevronUp } from 'lucide-react'
import { useScrollTop } from '@/hooks/useScrollTop'
import { useContenido } from '@/hooks/useContenido'

export default function FloatingButtons() {
  const { show, scrollTop } = useScrollTop(300)
  const { get } = useContenido()
  const waNumber = get('whatsapp', '56937478846')

  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-2.5 items-center">
      {/* WhatsApp */}
      <a
        href={`https://wa.me/${waNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
        style={{ background: '#25D366', width: 52, height: 52, borderRadius: '50%' }}
      >
        <svg viewBox="0 0 32 32" width="28" height="28" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2C8.268 2 2 8.268 2 16c0 2.456.662 4.876 1.92 7L2 30l7.28-1.88A13.94 13.94 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm7.28 19.44c-.3.84-1.76 1.62-2.4 1.68-.62.06-1.2.28-4.04-.84-3.38-1.38-5.56-4.8-5.72-5.02-.16-.22-1.3-1.72-1.3-3.28s.82-2.32 1.12-2.64c.3-.32.64-.4.86-.4h.62c.2 0 .46-.08.72.54.26.64.88 2.16.96 2.32.08.16.14.36.02.58-.12.22-.18.36-.36.56-.18.2-.38.44-.54.6-.18.18-.36.38-.16.74.2.36.9 1.5 1.94 2.42 1.34 1.18 2.46 1.56 2.82 1.72.36.16.56.14.76-.08.2-.22.86-1 1.08-1.34.22-.34.44-.28.74-.16.3.12 1.9.9 2.22 1.06.32.16.54.24.62.38.08.14.08.8-.22 1.64z"/>
        </svg>
      </a>

      {/* Scroll to top */}
      <button
        onClick={scrollTop}
        aria-label="Volver al inicio"
        className={`w-11 h-11 rounded-full flex items-center justify-center border border-[#e8edf2] bg-white shadow-md transition-all duration-300 hover:border-[#1C3D5C] hover:bg-[#1C3D5C] hover:text-white group ${
          show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ChevronUp aria-hidden="true" size={16} className="text-[#0F2535] group-hover:text-white transition-colors" />
      </button>
    </div>
  )
}
