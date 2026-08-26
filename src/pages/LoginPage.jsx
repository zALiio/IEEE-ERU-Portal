import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabaseClient'
import { Sun, Moon, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import logo from '../assets/img/falg-blue.webp'

export default function LoginPage() {
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 glass-pill hover:bg-primary/10 transition-colors"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="glass p-10 max-w-md w-full text-center">
        <img src={logo} alt="IEEE ERU" className="mx-auto mb-6 h-14 w-14 object-contain" />
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

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="text-foreground/40 text-xs text-center mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
