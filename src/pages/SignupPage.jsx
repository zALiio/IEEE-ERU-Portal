import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabaseClient'
import { Sun, Moon, UserPlus, Eye, EyeOff } from 'lucide-react'
import { FadeIn } from '../components/FadeIn'


export default function SignupPage() {
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [teams, setTeams] = useState([])
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [teamId, setTeamId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.from('teams').select('id, name').order('name').then(({ data, error }) => {
      if (!error && data) setTeams(data)
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!teamId) {
      setError('Please select a team')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, team_id: teamId },
        emailRedirectTo: import.meta.env.VITE_EMAIL_REDIRECT_URL ?? 'https://hub.ieee-eru.org/'
      }
    })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/pending')
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4 relative">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 glass-pill hover:bg-primary/10 transition-colors z-10"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <FadeIn className="glass p-6 sm:p-10 max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <UserPlus className="mx-auto mb-4 text-primary" size={36} />
          <h1 className="text-2xl font-black uppercase tracking-tight glow-text">
            Join IEEE ERU
          </h1>
          <p className="text-foreground/50 text-sm mt-2">Create your member account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full glass-pill px-5 py-3 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm"
          />
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
              minLength={6}
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
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            required
            className="w-full glass-pill px-5 py-3 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm"
          >
            <option value="" disabled>Select your team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id} className="bg-background">
                {t.name}
              </option>
            ))}
          </select>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="text-foreground/40 text-xs text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </FadeIn>
    </div>
  )
}
