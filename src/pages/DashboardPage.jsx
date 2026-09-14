import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { Sun, Moon, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import NotificationBell from '../components/NotificationBell'
import AnnouncementsFeed from '../components/AnnouncementsFeed'
import ScrollToTopButton from '../components/ScrollToTopButton'
import Wave from '../components/Wave'
import { FadeIn } from '../components/FadeIn'

import logo from '../assets/img/ieee-eru-full.webp'

import MemberDashboard from './dashboards/MemberDashboard'
import LeaderDashboard from './dashboards/LeaderDashboard'
import ExcomAdminDashboard from './dashboards/ExcomAdminDashboard'
import useBrowserNotifications from '../hooks/useBrowserNotifications'

export default function DashboardPage() {
  const { isDark, toggleTheme } = useTheme()
  const { profile, signOut } = useAuth()
  useBrowserNotifications(profile?.id)

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
    <div className="min-h-dvh bg-background flex flex-col items-center px-4 sm:px-6 py-8 sm:py-12 relative">
      <FadeIn className="w-full max-w-4xl flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 mb-8">
        <img
          src={logo}
          alt="IEEE ERU"
          className="dashboard-header-logo h-20 w-20 sm:h-24 sm:w-24 object-contain pointer-events-none select-none justify-self-center order-1 sm:order-2"
        />
        <Link to="/profile" className="min-w-0 hover:opacity-80 transition-opacity order-2 sm:order-1 text-center sm:text-left w-full sm:w-auto">
          <h1 className="dashboard-header-name text-lg sm:text-xl font-black uppercase tracking-tight glow-text truncate">
            {profile?.full_name}
          </h1>
          <p className="text-foreground/40 text-xs uppercase tracking-[0.2em] mt-1 truncate">
            {profile?.role} · {profile?.teams?.name ?? 'No team'}
          </p>
        </Link>
        <div className="flex items-center gap-2 shrink-0 justify-self-center sm:justify-self-end order-3">
          <NotificationBell />
          <button
            onClick={toggleTheme}
            className="p-3 glass-pill hover:bg-primary/10 transition-colors z-10"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={signOut}
            className="glass-pill p-3 sm:px-4 sm:py-2.5 flex items-center gap-2 text-xs hover:bg-primary/10 transition-colors"
          >
            <LogOut size={14} /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </FadeIn>

      <div className="tech-divider w-full max-w-4xl my-6" />

      <FadeIn delay={0.1} className="w-full max-w-4xl">
        <AnnouncementsFeed />
      </FadeIn>

      <Wave className="w-full max-w-4xl my-6" height={28} />

      <FadeIn delay={0.18} className="w-full max-w-4xl">
        {renderRoleView()}
      </FadeIn>
      <ScrollToTopButton />
    </div>
  )
}
