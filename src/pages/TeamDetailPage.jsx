import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabaseClient'
import { Sun, Moon, ArrowLeft, Users, X, ClipboardList, History, Crown, Shield } from 'lucide-react'

const TASK_STATUS_STYLES = {
  todo: 'text-foreground/40',
  in_progress: 'text-amber-400',
  submitted: 'text-blue-400',
  confirmed: 'text-green-400',
}

export default function TeamDetailPage() {
  const { teamId } = useParams()
  const { isDark, toggleTheme } = useTheme()

  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedMember, setSelectedMember] = useState(null)
  const [memberTasks, setMemberTasks] = useState([])
  const [memberPoints, setMemberPoints] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: teamRow, error: teamError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .single()

      if (teamError) {
        setError(teamError.message)
        setLoading(false)
        return
      }
      setTeam(teamRow)

      const { data: memberRows } = await supabase
        .from('profiles')
        .select('id, full_name, role, points')
        .eq('team_id', teamId)
        .eq('status', 'active')
        .order('full_name')
      setMembers(memberRows ?? [])

      const { data: leadRows } = await supabase
        .from('team_leads')
        .select('id, position, profile_id, profiles(full_name)')
        .eq('team_id', teamId)
      setLeads(leadRows ?? [])

      setLoading(false)
    }
    load()
  }, [teamId])

  const openMember = async (member) => {
    setSelectedMember(member)
    setDetailLoading(true)

    const [{ data: tasks }, { data: points }] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', member.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('points_log')
        .select('*')
        .eq('profile_id', member.id)
        .order('created_at', { ascending: false }),
    ])

    setMemberTasks(tasks ?? [])
    setMemberPoints(points ?? [])
    setDetailLoading(false)
  }

  const closeMember = () => {
    setSelectedMember(null)
    setMemberTasks([])
    setMemberPoints([])
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

      <div className="max-w-2xl w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-foreground/50 hover:text-foreground/80 text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Users className="text-primary" size={28} />
          <h1 className="text-2xl font-black uppercase tracking-tight glow-text">
            {team?.name ?? 'Team'}
          </h1>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {!loading && leads.length > 0 && (
          <div className="glass p-5 mb-6 space-y-2">
            {leads.filter((l) => l.position === 'head').map((l) => (
              <div key={l.id} className="flex items-center gap-2 text-sm">
                <Crown size={15} className="text-yellow-400" />
                <span className="font-semibold">{l.profiles?.full_name}</span>
                <span className="text-foreground/40 text-xs uppercase tracking-wide">Head</span>
              </div>
            ))}
            {leads.filter((l) => l.position === 'vice_head').map((l) => (
              <div key={l.id} className="flex items-center gap-2 text-sm">
                <Shield size={14} className="text-foreground/50" />
                <span className="font-semibold">{l.profiles?.full_name}</span>
                <span className="text-foreground/40 text-xs uppercase tracking-wide">Vice Head</span>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-foreground/40 text-sm">Loading…</p>
        ) : members.length === 0 ? (
          <div className="glass p-8 text-center">
            <p className="text-foreground/40 text-sm">No active members on this team yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => {
              const lead = leads.find((l) => l.profile_id === m.id)
              return (
                <button
                  key={m.id}
                  onClick={() => openMember(m)}
                  className="w-full glass p-5 flex items-center justify-between text-left hover:bg-primary/10 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{m.full_name}</p>
                    <p className="text-foreground/40 text-xs uppercase tracking-wide">
                      {m.role}{lead ? ` (${lead.position === 'head' ? 'Head' : 'Vice Head'})` : ''}
                    </p>
                  </div>
                  <p className="text-primary font-bold">{m.points} pts</p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50" onClick={closeMember}>
          <div
            className="glass p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">{selectedMember.full_name}</h2>
                <p className="text-foreground/40 text-xs uppercase tracking-wide">{selectedMember.role} · {selectedMember.points} pts</p>
              </div>
              <button onClick={closeMember} className="p-2 glass-pill hover:bg-primary/10 transition-colors" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {detailLoading ? (
              <p className="text-foreground/40 text-sm">Loading…</p>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList size={16} className="text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wide text-foreground/70">Tasks</h3>
                  </div>
                  {memberTasks.length === 0 ? (
                    <p className="text-foreground/40 text-xs">No tasks assigned.</p>
                  ) : (
                    <div className="space-y-2">
                      {memberTasks.map((t) => (
                        <div key={t.id} className="glass-pill px-4 py-2.5 flex items-center justify-between gap-3">
                          <p className="text-sm truncate">{t.title}</p>
                          <span className={`text-xs font-semibold shrink-0 ${TASK_STATUS_STYLES[t.status] ?? 'text-foreground/40'}`}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <History size={16} className="text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wide text-foreground/70">Points History</h3>
                  </div>
                  {memberPoints.length === 0 ? (
                    <p className="text-foreground/40 text-xs">No points history yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {memberPoints.map((p) => (
                        <div key={p.id} className="glass-pill px-4 py-2.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm truncate">{p.note}</p>
                            <p className="text-foreground/30 text-[10px] uppercase tracking-wide">{p.entry_type}</p>
                          </div>
                          <span className={`text-sm font-bold shrink-0 ${p.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {p.points >= 0 ? '+' : ''}{p.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
