import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useWelcome } from '../context/WelcomeContext'
import logo from '../assets/img/falg-blue.webp'
import fullLogo from '../assets/img/ieee-eru-full.webp'

const EASE = [0.22, 1, 0.36, 1]
const POP = [0.34, 1.3, 0.64, 1]

export default function WelcomeOverlay() {
  const { active, name, logoRect, endWelcome } = useWelcome()

  const [phase, setPhase] = useState('logo')          // logo | welcome | flight | fade
  const [center, setCenter] = useState({ x: 0, y: 0 })
  const [loginLogo, setLoginLogo] = useState(null)    // captured login-card logo rect
  const [nameMetrics, setNameMetrics] = useState(null) // { w, h, fs } of the welcome name
  const [labelMetrics, setLabelMetrics] = useState(null) // { w } of "Welcome back"
  const [targets, setTargets] = useState(null)        // dashboard header logo/name rects

  const nameRef = useRef(null)
  const labelRef = useRef(null)

  // ---- Measure once: login-logo start rect + hidden welcome text metrics ----
  useLayoutEffect(() => {
    if (!active) return
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    setCenter({ x: cx, y: cy })
    setLoginLogo(
      logoRect && logoRect.width > 0
        ? { x: logoRect.x, y: logoRect.y, width: logoRect.width, height: logoRect.height }
        : { x: cx - 28, y: cy - 28, width: 56, height: 56 }
    )
    if (nameRef.current) {
      const r = nameRef.current.getBoundingClientRect()
      setNameMetrics({
        w: r.width,
        h: r.height,
        fs: parseFloat(getComputedStyle(nameRef.current).fontSize),
      })
    }
    if (labelRef.current) {
      const r = labelRef.current.getBoundingClientRect()
      setLabelMetrics({ w: r.width, h: r.height })
    }
  }, [active, logoRect])

  // ---- Phase timers (logo rolls in, welcome holds, then rolls back — ~2.4s) ----
  useEffect(() => {
    if (!active) return
    setPhase('logo')
    const t1 = setTimeout(() => setPhase('welcome'), 350)
    const t2 = setTimeout(() => setPhase('flight'), 1900)   // welcome holds ~1.55s
    const t3 = setTimeout(() => setPhase('fade'), 2400)      // flight 500ms
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
    }
  }, [active])

  // ---- Measure dashboard header targets once they exist, so flight lands exactly ----
  // The dashboard mounts behind the opaque veil, so the header may not be laid out in
  // the same frame the flight phase starts — retry until it is (bounded). If the targets
  // never appear the veil still fades as a clean fallback.
  useEffect(() => {
    if (phase !== 'flight') return
    let cancelled = false
    let timer
    const measure = () => {
      if (cancelled) return
      const t = {}
      const hLogo = document.querySelector('.dashboard-header-logo')
      const hName = document.querySelector('.dashboard-header-name')
      if (hLogo) {
        const r = hLogo.getBoundingClientRect()
        t.logo = { x: r.left, y: r.top, width: r.width, height: r.height }
      }
      if (hName) {
        const r = hName.getBoundingClientRect()
        t.name = {
          x: r.left,
          y: r.top,
          width: r.width,
          height: r.height,
          fontSize: parseFloat(getComputedStyle(hName).fontSize),
        }
      }
      if (t.logo || t.name) {
        setTargets(t)
        return
      }
      timer = setTimeout(measure, 60)
    }
    timer = setTimeout(measure, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [phase])

  // ---- Lock body scroll while the veil is up ----
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [active])

  const veilComplete = useCallback(() => {
    if (phase === 'fade') endWelcome()
  }, [phase, endWelcome])

  if (!active) return null

  // Only mount position-critical pieces once the login logo + viewport center are measured
  // (measured in a layout effect before the first paint, so nothing visibly pops).
  const ready = center.x > 0 && loginLogo != null

  const cx = center.x
  const cy = center.y
  const ll = loginLogo ?? { x: cx - 28, y: cy - 28, width: 56, height: 56 }

  // While the flight targets aren't measured yet, stay on the welcome pose so nothing
  // lurches or blinks (animating toward an empty target set is what dropped the name out).
  const effPhase = phase === 'flight' && !targets ? 'welcome' : phase

  const nm = nameMetrics

  // Responsive logo size: scale with viewport, capped to prevent overflow on small screens.
  // Reduced 208→160 so the whole welcome scene reads smaller while staying balanced.
  const logoSize = Math.min(160, Math.min(window.innerWidth * 0.35, window.innerHeight * 0.3))

  // Welcome-scene vertical stack — compute from measured heights so everything
  // stays centered regardless of viewport or font size.
  const labelH = labelMetrics?.h ?? 28
  const nameH = nm?.h ?? 56
  const GAP_LOGO_LABEL = 12
  const GAP_LABEL_NAME = 8
  const totalH = logoSize + GAP_LOGO_LABEL + labelH + GAP_LABEL_NAME + nameH
  const stackTop = cy - totalH / 2

  const logoCenterY = stackTop + logoSize / 2
  const labelY = stackTop + logoSize + GAP_LOGO_LABEL
  const nameY = labelY + labelH + GAP_LABEL_NAME

  // ---- Logo: lift off from the login card, hold center, fly to header ----
  const logoAnimate = {
    logo: {
      x: cx - 44, y: logoCenterY - 44, width: 88, height: 88,
      rotate: 720,
      transition: { duration: 0.5, ease: POP },
    },
    welcome: {
      x: cx - 44, y: logoCenterY - 44, width: 88, height: 88,
      rotate: 720, opacity: 0, scale: 1.15,
      transition: { duration: 0.35, ease: EASE },
    },
    flight: { opacity: 0 },
    fade: { opacity: 0 },
  }[effPhase]

  // ---- Full logo: crossfades in during welcome, then rolls back to dashboard ----
  const fullLogoAnimate = {
    logo: { x: ll.x, y: ll.y, width: ll.width, height: ll.height, opacity: 0, scale: 0.85 },
    welcome: {
      x: cx - logoSize / 2, y: logoCenterY - logoSize / 2, width: logoSize, height: logoSize,
      rotate: 0, opacity: 1, scale: 1,
      transition: { duration: 0.4, ease: EASE },
    },
    flight: targets?.logo
      ? { ...targets.logo, rotate: 720, transition: { duration: 0.5, ease: EASE } }
      : {},
    fade: { opacity: 0, transition: { duration: 0.12, ease: EASE } },
  }[effPhase]

  // ---- Name: hidden → centered welcome → header top-left ----
  const nameAnimate = {
    logo: { opacity: 0 },
    welcome: nm
      ? {
          x: cx - nm.w / 2,
          y: nameY,
          width: nm.w,
          height: nm.h,
          fontSize: nm.fs,
          opacity: 1,
          transition: { duration: 0.3, delay: 0.04, ease: EASE },
        }
      : {},
    flight: nm && targets?.name
      ? {
          x: targets.name.x,
          y: targets.name.y,
          width: nm.w,
          height: nm.h,
          fontSize: targets.name.fontSize,
          opacity: 1,
          transition: { duration: 0.5, ease: EASE },
        }
      : { opacity: 1 },
    fade: { opacity: 0, transition: { duration: 0.12, ease: EASE } },
  }[effPhase]

  // ---- Label: fades out when the name flies away ----
  const labelAnimate = {
    logo: { opacity: 0 },
    welcome: { opacity: 1, transition: { duration: 0.3, delay: 0.08, ease: EASE } },
    flight: { opacity: 0, y: -14, transition: { duration: 0.3, ease: EASE } },
    fade: { opacity: 0 },
  }[effPhase]

  const labelX = labelMetrics ? cx - labelMetrics.w / 2 : cx - 70

  const glowAnimate = {
    logo: { opacity: [0, 0.6, 0.35], transition: { duration: 0.7, ease: EASE } },
    welcome: { opacity: 0.45, scale: 1.35, transition: { duration: 0.45, ease: EASE } },
    flight: { opacity: 0.2, scale: 1.6, transition: { duration: 0.3, ease: EASE } },
    fade: { opacity: 0, transition: { duration: 0.2, ease: EASE } },
  }[effPhase]

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-background overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'fade' ? 0 : phase === 'flight' ? 0.12 : 1 }}
      transition={{ duration: phase === 'fade' ? 0.3 : phase === 'flight' ? 0.45 : 0.2, ease: EASE }}
      onAnimationComplete={veilComplete}
      style={{ willChange: 'opacity' }}
    >
      {/* Ambient glow behind the logo */}
      {ready && (
        <motion.div
          className="absolute rounded-full blur-[120px] pointer-events-none"
          style={{
            width: 380,
            height: 380,
            x: cx - 190,
            y: logoCenterY - 190,
            background: 'radial-gradient(circle, rgba(0,91,152,0.28) 0%, transparent 70%)',
            willChange: 'opacity, transform',
          }}
          animate={glowAnimate}
        />
      )}

      {/* Towers-only logo — lifts off from login card, then fades out */}
      {ready && (
        <motion.img
          src={logo}
          alt="IEEE ERU"
          className="object-contain"
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            x: ll.x,
            y: ll.y,
            width: ll.width,
            height: ll.height,
            zIndex: 10,
            willChange: 'transform, width, height, opacity',
          }}
          initial={{ x: ll.x, y: ll.y, width: ll.width, height: ll.height }}
          animate={logoAnimate}
        />
      )}

      {/* Full logo — crossfades in during welcome, rolls back to dashboard */}
      {ready && (
        <motion.img
          src={fullLogo}
          alt="IEEE ERU Student Branch"
          className="object-contain"
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            x: ll.x,
            y: ll.y,
            width: ll.width,
            height: ll.height,
            zIndex: 11,
            willChange: 'transform, width, height, opacity',
          }}
          initial={{ x: ll.x, y: ll.y, width: ll.width, height: ll.height, opacity: 0 }}
          animate={fullLogoAnimate}
        />
      )}

      {/* "Welcome back" — fades away during the fly-out */}
      <motion.p
        ref={labelRef}
        className="text-foreground/40 text-[22px] uppercase tracking-[0.25em] m-0"
        style={{ position: 'fixed', left: 0, top: 0, x: labelX, y: labelY, zIndex: 10, willChange: 'transform, opacity' }}
        animate={labelAnimate}
      >
        Welcome back
      </motion.p>

      {/* Name — hidden while measured, greets, then flies to the header name */}
      <motion.div
        ref={nameRef}
        className="text-[28px] sm:text-[44px] md:text-[52px] font-black uppercase tracking-tight glow-text whitespace-nowrap m-0 max-w-[90vw] overflow-hidden text-ellipsis"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          x: 0,
          y: 0,
          opacity: 0,
          fontSize: nm?.fs,
          zIndex: 10,
          willChange: 'transform, opacity',
        }}
        initial={{ opacity: 0 }}
        animate={nameAnimate}
      >
        {name}
      </motion.div>
    </motion.div>
  )
}