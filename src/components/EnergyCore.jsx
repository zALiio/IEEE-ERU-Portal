// Concentric expanding pulse rings (the "energy core" from ieee-eru.org).
// Pure CSS animation; each ring is staggered and grows to its own scale.
// `parallax` (transform-only) makes the core drift slightly against the cursor
// for a little depth — cheap on mid-end devices: no layout reads per move,
// just two motion-value sets feeding the transform.
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

const RINGS = [
  { scale: 45, delay: 0 },
  { scale: 85, delay: 1.4 },
  { scale: 130, delay: 2.8 },
]

export default function EnergyCore({ size = 520, muted = false, parallax = false, className = '', style = {} }) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 40, damping: 16 })
  const sy = useSpring(my, { stiffness: 40, damping: 16 })
  const x = useTransform(sx, (v) => v * -12)
  const y = useTransform(sy, (v) => v * -12)

  useEffect(() => {
    if (!parallax) return
    const onMove = (e) => {
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [parallax, mx, my])

  return (
    <motion.div
      className={`energy-core ${muted ? 'energy-core--muted' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        // Center a 50%/50% positioned core without a translate transform, so
        // framer-motion owns `transform` for the parallax offset.
        ...(parallax ? { marginLeft: -size / 2, marginTop: -size / 2 } : {}),
        ...style,
        x: parallax ? x : 0,
        y: parallax ? y : 0,
      }}
      aria-hidden="true"
    >
      <div className="energy-core-pulse" style={{ animationDelay: '0s' }} />
      {RINGS.map((r, i) => (
        <span
          key={i}
          className="energy-ring"
          style={{ animationDelay: `${r.delay}s`, ['--ring-scale']: r.scale }}
        />
      ))}
    </motion.div>
  )
}