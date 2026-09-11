import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { Sun, Moon, Clock } from 'lucide-react'
import { FadeIn } from '../components/FadeIn'

export default function PendingApprovalPage() {
  const { isDark, toggleTheme } = useTheme()
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
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

      <FadeIn className="glass p-10 max-w-md w-full text-center">
        <Clock className="mx-auto mb-6 text-primary" size={40} />
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2 glow-text">
          Awaiting Approval
        </h1>
        <p className="text-foreground/50 text-sm leading-relaxed mb-8">
          {profile?.full_name ? `Hi ${profile.full_name}, y` : 'Y'}our account has been created
          and is waiting for an Excom or Admin member to approve it.
          You'll be able to log in normally once approved.
        </p>
        <button onClick={handleSignOut} className="btn-primary w-full">
          Sign Out
        </button>
      </FadeIn>
    </div>
  )
}
