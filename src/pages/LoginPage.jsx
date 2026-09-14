import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { useWelcome } from '../context/WelcomeContext'
import { supabase } from '../lib/supabaseClient'
import { Sun, Moon, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { FadeIn } from '../components/FadeIn'
import EnergyCore from '../components/EnergyCore'
import { useMagnetic } from '../hooks/useMagnetic'

import logo from '../assets/img/falg-blue.webp'

export default function LoginPage() {
  const { isDark, toggleTheme } = useTheme()
  const { startWelcome } = useWelcome()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const logoRef = useRef(null)
  const { ref: magnetRef, style: magnetStyle, onMouseEnter, onMouseMove, onMouseLeave } = useMagnetic()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', data.user.id)
      .single()

    const rect = logoRef.current?.getBoundingClientRect()
    startWelcome(profile?.full_name || email.split('@')[0], rect)
    navigate('/')
  }

  return (
    <div className="h-dvh bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <EnergyCore
        size={520}
        parallax
        className="opacity-60"
        style={{ position: 'fixed', left: '50%', top: '50%' }}
      />
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 glass-pill hover:bg-primary/10 transition-colors z-10"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <FadeIn className="glass p-6 sm:p-10 max-w-md w-full text-center relative z-10">
        <img ref={logoRef} src={logo} alt="IEEE ERU" className="mx-auto mb-6 sm:mb-8 h-20 w-20 sm:h-24 sm:w-24 object-contain" />
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2 glow-text">
          IEEE ERU Portal
        </h1>
        <p className="text-foreground/50 text-sm uppercase tracking-[0.3em] mb-8">
          Member Login
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full glass-pill px-5 py-3 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full glass-pill px-5 py-3 pr-12 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <motion.button
            ref={magnetRef}
            style={magnetStyle}
            onMouseEnter={onMouseEnter}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-50"
          >
            {submitting ? 'Logging in…' : 'Log In'}
          </motion.button>
        </form>

        <p className="text-foreground/40 text-xs text-center mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </FadeIn>
    </div>
  )
}
