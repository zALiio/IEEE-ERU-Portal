import { motion, useScroll, useSpring } from 'framer-motion'

/**
 * Thin IEEE-blue reading-progress bar pinned to the top of the viewport.
 * ScaleX + spring only — nothing reflows, so it stays cheap on mid-end devices.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-[150] bg-primary pointer-events-none"
      style={{ scaleX }}
    />
  )
}