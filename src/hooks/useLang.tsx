import { createContext, useContext, useState, type ReactNode } from 'react'
import { translations } from '@/lib/i18n'
import type { Lang } from '@/types'

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: typeof translations['es'] & typeof translations['en']
}

const LangContext = createContext<LangContextType | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('es')
  const t = translations[lang]
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}
