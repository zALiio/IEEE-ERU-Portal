import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabaseClient'
import { Sun, Moon, ArrowLeft, Trophy, Medal } from 'lucide-react'
import { FadeIn } from '../components/FadeIn'

const RANK_STYLES = {
  0: 'text-yellow-400',
  1: 'text-foreground/60',
  2: 'text-amber-600',
}

export default function LeaderboardPage() {
  const { isDark, toggleTheme } = useTheme()
  const [members, setMembers] = useState([])
  const [teams, setTeams] = useState([])
  const [teamFilter, setTeamFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: teamRows } = await supabase.from('teams').select('id, name').order('name')
      setTeams(teamRows ?? [])

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, points, team_id, teams!profiles_team_id_fkey(name)')
        .eq('status', 'active')
        .order('points', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setMembers(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const visible = teamFilter ? members.filter((m) => m.team_id === teamFilter) : members

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-16">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 glass-pill hover:bg-primary/10 transition-colors"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <FadeIn className="max-w-4xl w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-foreground/50 hover:text-foreground/80 text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-primary" size={28} />
          <h1 className="text-2xl font-black uppercase tracking-tight glow-text">
            Leaderboard
          </h1>
        </div>

        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm mb-6"
        >
          <option value="" className="bg-background">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id} className="bg-background">{t.name}</option>
          ))}
        </select>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading ? (
          <p className="text-foreground/40 text-sm">Loading…</p>
        ) : visible.length === 0 ? (
          <div className="glass p-8 text-center">
            <p className="text-foreground/40 text-sm">No members to rank yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((m, i) => (
              <div key={m.id} className="glass p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-8 shrink-0 flex items-center justify-center">
                    {i < 3 ? (
                      <Medal className={RANK_STYLES[i]} size={22} />
                    ) : (
                      <span className="text-foreground/40 text-sm font-bold">{i + 1}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{m.full_name}</p>
                    <p className="text-foreground/40 text-xs uppercase tracking-wide">
                      {m.role} · {m.teams?.name ?? 'No team'}
                    </p>
                  </div>
                </div>
                <p className="text-primary font-bold shrink-0">{m.points ?? 0} pts</p>
              </div>
            ))}
          </div>
        )}
      </FadeIn>
    </div>
  )
}
