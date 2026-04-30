import { useState, useEffect } from 'react'

export function useScrollTop(threshold = 60) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return { show, scrollTop }
}
