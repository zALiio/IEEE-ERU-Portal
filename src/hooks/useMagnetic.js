import { useRef } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'

/**
 * Magnetic pull for buttons/CTAs — the element leans toward the cursor and
 * springs back on leave. Bounding rect is measured once on mouse-enter and
 * cached, so each move is only two motion-value sets (transform-only).
 */
export function useMagnetic(pull = 0.3) {
  const ref = useRef(null)
  const rect = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 160, damping: 14, mass: 0.2 })
  const sy = useSpring(y, { stiffness: 160, damping: 14, mass: 0.2 })

  const onMouseEnter = () => {
    if (rect.current || !ref.current) return
    rect.current = ref.current.getBoundingClientRect()
  }
  const onMouseMove = (e) => {
    const r = rect.current
    if (!r) return
    x.set((e.clientX - (r.left + r.width / 2)) * pull)
    y.set((e.clientY - (r.top + r.height / 2)) * pull)
  }
  const onMouseLeave = () => {
    rect.current = null
    x.set(0)
    y.set(0)
  }

  return { ref, style: { x: sx, y: sy }, onMouseEnter, onMouseMove, onMouseLeave }
}