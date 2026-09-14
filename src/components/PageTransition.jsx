import { useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'

const TRANSITIONS = {
  // Default: smooth slide up + fade
  default: {
    enter: (el) => {
      gsap.set(el, { opacity: 0, y: 30 })
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
      })
    },
    exit: (el) => {
      return gsap.to(el, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: 'power2.in',
      })
    },
  },
  // Auth pages: scale up from center
  auth: {
    enter: (el) => {
      gsap.set(el, { opacity: 0, scale: 0.95, y: 16 })
      gsap.to(el, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.55,
        ease: 'back.out(1.2)',
      })
    },
    exit: (el) => {
      return gsap.to(el, {
        opacity: 0,
        scale: 0.97,
        duration: 0.25,
        ease: 'power2.in',
      })
    },
  },
  // Dashboard: subtle reveal
  dashboard: {
    enter: (el) => {
      gsap.set(el, { opacity: 0, y: 20 })
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: 'power3.out',
      })
      // Stagger child glass panels
      const panels = el.querySelectorAll('.glass')
      if (panels.length > 1) {
        gsap.fromTo(panels,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, delay: 0.15, ease: 'power2.out' }
        )
      }
    },
    exit: (el) => {
      return gsap.to(el, {
        opacity: 0,
        y: -12,
        duration: 0.25,
        ease: 'power2.in',
      })
    },
  },
  // Sub-page (directory, leaderboard, etc.): slide from right
  subpage: {
    enter: (el) => {
      gsap.set(el, { opacity: 0, x: 40 })
      gsap.to(el, {
        opacity: 1,
        x: 0,
        duration: 0.45,
        ease: 'power3.out',
      })
    },
    exit: (el) => {
      return gsap.to(el, {
        opacity: 0,
        x: -30,
        duration: 0.25,
        ease: 'power2.in',
      })
    },
  },
}

// Map routes to transition types
const ROUTE_MAP = {
  '/login': 'auth',
  '/signup': 'auth',
  '/pending': 'auth',
  '/': 'dashboard',
  '/approve': 'subpage',
  '/directory': 'subpage',
  '/team': 'subpage',
  '/profile': 'subpage',
  '/announcements': 'subpage',
  '/tasks': 'subpage',
  '/analytics': 'subpage',
  '/leaderboard': 'subpage',
  '/events': 'subpage',
}

function getTransitionType(pathname) {
  if (ROUTE_MAP[pathname]) return ROUTE_MAP[pathname]
  // Dynamic routes like /team/:id
  if (pathname.startsWith('/team/')) return 'subpage'
  return 'default'
}

function AnimatedPage({ children }) {
  const ref = useRef(null)
  const location = useLocation()
  const type = getTransitionType(location.pathname)
  const transition = TRANSITIONS[type]

  useEffect(() => {
    if (ref.current) {
      transition.enter(ref.current)
    }
  }, [location.pathname])

  return (
    <motion.div
      ref={ref}
      key={location.pathname}
      exit={{ opacity: 0 }}
      transition={{ duration: 0 }}
      className="min-h-dvh"
    >
      {children}
    </motion.div>
  )
}

export default function PageTransition({ children }) {
  const location = useLocation()
  const exitRef = useRef(null)

  const handleExitComplete = () => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      <AnimatedPage key={location.pathname}>
        {children}
      </AnimatedPage>
    </AnimatePresence>
  )
}
