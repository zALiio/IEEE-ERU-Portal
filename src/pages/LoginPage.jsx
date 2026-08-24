import { useTheme } from '../context/ThemeContext'
import { Sun, Moon, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const { isDark, toggleTheme } = useTheme()

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
        <ShieldCheck className="mx-auto mb-6 text-primary" size={40} />
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2 glow-text">
          IEEE ERU Portal
        </h1>
        <p className="text-white/50 text-sm uppercase tracking-[0.3em] mb-8">
          Scaffold Online
        </p>
        <p className="text-white/40 text-sm leading-relaxed">
          Theme system, routing, and Supabase client are wired up.
          Login and role-based dashboard come next.
        </p>
      </div>
    </div>
  )
}
