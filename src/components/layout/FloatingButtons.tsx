import { ChevronUp } from 'lucide-react'
import { useScrollTop } from '@/hooks/useScrollTop'

const WA_NUMBER = '56931038954'

export default function FloatingButtons() {
  const { show, scrollTop } = useScrollTop(300)

  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-2.5 items-center">
      {/* WhatsApp */}
      <a
        href={`https://wa.me/${WA_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-105"
        style={{ background: '#25D366' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.122 1.52 5.857L0 24l6.302-1.494A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
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
        <ChevronUp size={16} className="text-[#0F2535] group-hover:text-white transition-colors" />
      </button>
    </div>
  )
}
