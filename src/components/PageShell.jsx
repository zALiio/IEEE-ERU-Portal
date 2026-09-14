import { Link } from 'react-router-dom'
import { Sun, Moon, ArrowLeft } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { FadeIn } from './FadeIn'

// Shared page chrome: full-height container, theme toggle, back link, and the
// standard fade wrapper. Pages keep their own heading/body inside.
export default function PageShell({ backTo = '/', backLabel = 'Back to dashboard', width = 'max-w-4xl', children }) {
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-16 relative">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 glass-pill hover:bg-primary/10 transition-colors z-10"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <FadeIn className={`${width} w-full`}>
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-foreground/50 hover:text-foreground/80 text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> {backLabel}
        </Link>
        {children}
      </FadeIn>
    </div>
  )
}
