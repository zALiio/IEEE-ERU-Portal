import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Users, BookUser, ClipboardCheck, Check, Trophy, Calendar, ClipboardList, X } from 'lucide-react'
import NavDrawer from '../../components/NavDrawer'
import { Stagger, StaggerItem } from '../../components/FadeIn'

export default function LeaderDashboard() {
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)

  const loadTeam = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, points, team_id')
      .eq('team_id', profile.team_id)
      .eq('status', 'active')
      .order('full_name')
    setMembers(data ?? [])

    const { data: pendingTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'submitted')
      .in('assigned_to', (data ?? []).map((m) => m.id))
      .order('created_at', { ascending: true })
    setPending(pendingTasks ?? [])

    setLoading(false)
  }

  useEffect(() => {
    if (profile?.team_id) loadTeam()
  }, [profile?.team_id])

  const confirmTask = async (taskId) => {
    setConfirmingId(taskId)
    const { error } = await supabase.rpc('confirm_task', { p_task_id: taskId })
    setConfirmingId(null)

    if (error) {
      setError(error.message)
      return
    }
    await loadTeam()
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
    await loadTeam()
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Users className="text-primary" size={24} />
          <h2 className="text-lg font-bold uppercase tracking-tight text-foreground/70">
            {profile?.teams?.name ?? 'Your Team'}
          </h2>
        </div>
        <NavDrawer
          items={[
            { label: 'Tasks', icon: ClipboardList, to: '/tasks' },
            { label: 'Leaderboard', icon: Trophy, to: '/leaderboard' },
            { label: 'Events', icon: Calendar, to: '/events' },
            { label: 'Directory', icon: BookUser, to: '/directory' },
          ]}
        />
      </div>
      <div className="hidden sm:grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
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
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className="text-blue-400" size={18} />
            <h2 className="text-lg font-bold uppercase tracking-tight text-foreground/70">
              Pending Confirmation
            </h2>
          </div>
          <Stagger className="space-y-3">
            {pending.map((t) => {
              const assignee = members.find((m) => m.id === t.assigned_to)
              return (
                <StaggerItem key={t.id}>
                  <div className="glass p-5 flex items-center justify-between gap-4 border border-blue-400/20">
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
                </StaggerItem>
              )
            })}
          </Stagger>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {loading ? (
        <p className="text-foreground/40 text-sm">Loading…</p>
      ) : members.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-foreground/40 text-sm">No active members on your team yet.</p>
        </div>
      ) : (
        <Stagger className="space-y-3">
          {members.map((m) => (
            <StaggerItem key={m.id}>
              <div className="glass p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{m.full_name}</p>
                  <p className="text-foreground/40 text-xs uppercase tracking-wide">{m.role}</p>
                </div>
                <p className="text-primary font-bold">{m.points} pts</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}
