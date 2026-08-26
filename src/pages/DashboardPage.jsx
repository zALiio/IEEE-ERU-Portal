import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { Sun, Moon, LogOut } from 'lucide-react'
import NotificationBell from '../components/NotificationBell'
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
      <div className="w-full max-w-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-xl font-black uppercase tracking-tight glow-text truncate">
            {profile?.full_name}
          </h1>
          <p className="text-foreground/40 text-xs uppercase tracking-[0.2em] mt-1 truncate">
            {profile?.role} · {profile?.teams?.name ?? 'No team'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <NotificationBell />
          <button
            onClick={toggleTheme}
            className="p-3 glass-pill hover:bg-primary/10 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={signOut}
            className="glass-pill px-4 py-2.5 flex items-center gap-2 text-xs hover:bg-primary/10 transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {renderRoleView()}
    </div>
  )
}
