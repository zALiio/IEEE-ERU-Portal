import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'

// Round floating button that smooth-scrolls back to top (appears after 400px).
export default function ScrollToTopButton() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`scroll-top-btn ${show ? '' : 'scroll-top-btn--hidden'}`}
      aria-label="Scroll to top"
    >
      <ChevronUp size={20} />
    </button>
  )
}