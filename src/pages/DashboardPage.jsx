import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { Sun, Moon, LogOut } from 'lucide-react'
import MemberDashboard from './dashboards/MemberDashboard'
import LeaderDashboard from './dashboards/LeaderDashboard'
import ExcomAdminDashboard from './dashboards/ExcomAdminDashboard'

export default function DashboardPage() {
  const { isDark, toggleTheme } = useTheme()
  const { profile, signOut } = useAuth()

  const renderRoleView = () => {
    switch (profile?.role) {
      case 'leader':
        return <LeaderDashboard />
      case 'excom':
      case 'admin':
        return <ExcomAdminDashboard />
      case 'member':
      default:
        return <MemberDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-16">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 glass-pill hover:bg-primary/10 transition-colors"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight glow-text">
            {profile?.full_name}
          </h1>
          <p className="text-white/40 text-xs uppercase tracking-[0.2em] mt-1">
            {profile?.role} · {profile?.teams?.name ?? 'No team'}
          </p>
        </div>
        <button
          onClick={signOut}
          className="glass-pill px-4 py-2.5 flex items-center gap-2 text-xs hover:bg-primary/10 transition-colors"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {renderRoleView()}
    </div>
  )
}
