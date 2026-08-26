import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { Building2, Users, BookUser, ClipboardCheck, Check, Trophy } from 'lucide-react'

export default function ExcomAdminDashboard() {
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
      .select('id, full_name, team_id, points, status')
      .eq('status', 'active')

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

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="text-primary" size={24} />
          <h2 className="text-lg font-bold uppercase tracking-tight text-white/70">
            All Teams
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/leaderboard" className="glass-pill text-xs px-4 py-2 flex items-center gap-2 hover:bg-primary/10 transition-colors">
            <Trophy size={14} /> Leaderboard
          </Link>
          <Link to="/directory" className="glass-pill text-xs px-4 py-2 flex items-center gap-2 hover:bg-primary/10 transition-colors">
            <BookUser size={14} /> Directory
          </Link>
          <Link to="/approve" className="btn-primary text-xs px-4 py-2 flex items-center gap-2">
            <Users size={14} /> Approve Members
          </Link>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className="text-blue-400" size={18} />
            <h2 className="text-lg font-bold uppercase tracking-tight text-white/70">
              Pending Confirmation
            </h2>
          </div>
          <div className="space-y-3">
            {pending.map((t) => {
              const assignee = profilesById[t.assigned_to]
              return (
                <div key={t.id} className="glass p-5 flex items-center justify-between gap-4 border border-blue-400/20">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{t.title}</p>
                    <p className="text-white/40 text-xs mt-1">
                      {assignee?.full_name ?? 'Unknown member'} · {t.points} pts
                    </p>
                  </div>
                  <button
                    onClick={() => confirmTask(t.id)}
                    disabled={confirmingId === t.id}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    <Check size={14} /> {confirmingId === t.id ? 'Confirming…' : 'Confirm'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {loading ? (
        <p className="text-white/40 text-sm">Loading…</p>
      ) : (
        <div className="space-y-3">
          {teams.map((t) => (
            <Link
              key={t.id}
              to={`/team/${t.id}`}
              className="glass p-5 flex items-center justify-between hover:bg-primary/10 transition-colors"
            >
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-white/40 text-xs">{t.memberCount} active member{t.memberCount === 1 ? '' : 's'}</p>
              </div>
              <p className="text-primary font-bold">{t.totalPoints} pts</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
