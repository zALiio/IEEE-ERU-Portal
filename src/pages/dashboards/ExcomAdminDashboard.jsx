import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Building2, Users, BookUser, ClipboardCheck, Check, Trophy, X, Calendar, BarChart3, ClipboardList } from 'lucide-react'
import NavDrawer from '../../components/NavDrawer'
import SectionLabel from '../../components/SectionLabel'
import AnimatedNumber from '../../components/AnimatedNumber'
import MembersMarquee from '../../components/MembersMarquee'
import { FadeIn, Stagger, StaggerItem } from '../../components/FadeIn'

export default function ExcomAdminDashboard() {
  const { profile } = useAuth()
  const [teams, setTeams] = useState([])
  const [pending, setPending] = useState([])
  const [profilesById, setProfilesById] = useState({})
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data: teamRows } = await supabase.from('teams').select('id, name').order('name')

    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, full_name, role, team_id, points, status')
      .eq('status', 'active')
      .order('full_name')

    const byId = {}
    for (const p of profileRows ?? []) byId[p.id] = p
    setProfilesById(byId)

    const withStats = (teamRows ?? []).map((team) => {
      const members = (profileRows ?? []).filter((p) => p.team_id === team.id)
      return {
        ...team,
        memberCount: members.length,
        totalPoints: members.reduce((sum, m) => sum + (m.points ?? 0), 0),
      }
    })
    setTeams(withStats)

    const { data: pendingTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'submitted')
      .order('created_at', { ascending: true })
    setPending(pendingTasks ?? [])

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const confirmTask = async (taskId) => {
    setConfirmingId(taskId)
    const { error } = await supabase.rpc('confirm_task', { p_task_id: taskId })
    setConfirmingId(null)

    if (error) {
      setError(error.message)
      return
    }
    await load()
  }

  const rejectTask = async (taskId) => {
    const note = window.prompt('Reason for rejecting (optional):')
    if (note === null) return
    setConfirmingId(taskId)
    const { error } = await supabase.rpc('reject_task', { p_task_id: taskId, p_note: note || null })
    setConfirmingId(null)

    if (error) {
      setError(error.message)
      return
    }
    await load()
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Building2 className="text-primary" size={24} />
          <h2 className="text-lg font-bold uppercase tracking-tight text-foreground/70">
            All Teams
          </h2>
        </div>
        <NavDrawer
          items={[
            { label: 'Tasks', icon: ClipboardList, to: '/tasks' },
            { label: 'Leaderboard', icon: Trophy, to: '/leaderboard' },
            { label: 'Events', icon: Calendar, to: '/events' },
            { label: 'Directory', icon: BookUser, to: '/directory' },
            { label: 'Analytics', icon: BarChart3, to: '/analytics' },
            { label: 'Approve Members', icon: Users, to: '/approve' },
          ]}
        />
      </div>
      <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        <Link to="/tasks" className="glass-pill text-xs px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
          <ClipboardList size={14} /> Tasks
        </Link>
        <Link to="/leaderboard" className="glass-pill text-xs px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
          <Trophy size={14} /> Leaderboard
        </Link>
        <Link to="/events" className="glass-pill text-xs px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
          <Calendar size={14} /> Events
        </Link>
        <Link to="/directory" className="glass-pill text-xs px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
          <BookUser size={14} /> Directory
        </Link>
        <Link to="/analytics" className="glass-pill text-xs px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
          <BarChart3 size={14} /> Analytics
        </Link>
        <Link to="/approve" className="glass-pill text-xs px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
          <Users size={14} /> Approve Members
        </Link>
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className="text-blue-400" size={18} />
            <SectionLabel small>Pending Confirmation</SectionLabel>
          </div>
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pending.map((t) => {
              const assignee = profilesById[t.assigned_to]
              return (
                <StaggerItem key={t.id}>
                  <div className="glass p-5 flex items-center justify-between gap-4 border border-blue-400/20 h-full">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{t.title}</p>
                      <p className="text-foreground/40 text-xs mt-1">
                        {assignee?.full_name ?? 'Unknown member'} · {t.points} pts
                      </p>
                      {t.proof_url && (
                        <a href={t.proof_url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs underline mt-1 inline-block">
                          View Proof
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => confirmTask(t.id)}
                        disabled={confirmingId === t.id}
                        className="btn-primary text-xs px-4 py-2 flex items-center gap-2 shrink-0 disabled:opacity-50"
                      >
                        <Check size={14} /> {confirmingId === t.id ? 'Confirming…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => rejectTask(t.id)}
                        disabled={confirmingId === t.id}
                        className="glass-pill text-xs px-4 py-2 flex items-center gap-2 shrink-0 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                </StaggerItem>
              )
            })}
          </Stagger>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {loading ? (
        <p className="text-foreground/40 text-sm">Loading…</p>
      ) : (
        <>
          <div className="mb-3">
            <SectionLabel>Active Teams</SectionLabel>
          </div>
          <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teams.map((t) => (
              <StaggerItem key={t.id}>
                <Link
                  to={`/team/${t.id}`}
                  className="glass-glow p-5 flex items-center justify-between hover:bg-primary/10 transition-colors h-full"
                >
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-foreground/40 text-xs">
                      <AnimatedNumber value={t.memberCount} /> active member{t.memberCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <p className="text-primary font-bold"><AnimatedNumber value={t.totalPoints} /> pts</p>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
          <MembersMarquee className="mt-12" />
        </>
      )}
    </div>
  )
}
