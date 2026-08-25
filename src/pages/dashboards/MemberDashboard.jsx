import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Circle, PlayCircle, CheckCircle2, Award } from 'lucide-react'

const STATUS_FLOW = {
  todo: { next: 'in_progress', label: 'Start', icon: PlayCircle },
  in_progress: { next: 'done', label: 'Mark Done', icon: CheckCircle2 },
  done: null,
}

const STATUS_STYLES = {
  todo: 'text-white/40',
  in_progress: 'text-amber-400',
  done: 'text-green-400',
}

export default function MemberDashboard() {
  const { profile, refreshProfile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const loadTasks = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', profile.id)
      .order('created_at', { ascending: false })
    setTasks(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.id) loadTasks()
  }, [profile?.id])

  const advance = async (task) => {
    const next = STATUS_FLOW[task.status]?.next
    if (!next) return
    setBusyId(task.id)

    const { error } = await supabase
      .from('tasks')
      .update({ status: next })
      .eq('id', task.id)

    if (!error) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)))
      if (next === 'done') await refreshProfile()
    }
    setBusyId(null)
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="glass p-6 mb-6 flex items-center justify-between">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-[0.2em]">Total Points</p>
          <p className="text-3xl font-black glow-text">{profile?.points ?? 0}</p>
        </div>
        <Award className="text-primary" size={32} />
      </div>

      <h2 className="text-lg font-bold uppercase tracking-tight mb-3 text-white/70">Your Tasks</h2>

      {loading ? (
        <p className="text-white/40 text-sm">Loading…</p>
      ) : tasks.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-white/40 text-sm">No tasks assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => {
            const flow = STATUS_FLOW[t.status]
            const Icon = flow?.icon
            return (
              <div key={t.id} className="glass p-5 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Circle size={8} className={`fill-current ${STATUS_STYLES[t.status]}`} />
                    <p className="font-semibold truncate">{t.title}</p>
                  </div>
                  {t.description && (
                    <p className="text-white/40 text-xs mt-1 truncate">{t.description}</p>
                  )}
                  <p className="text-white/30 text-xs mt-1">
                    {t.points} pts{t.due_date ? ` · due ${t.due_date}` : ''}
                  </p>
                </div>
                {flow && (
                  <button
                    onClick={() => advance(t)}
                    disabled={busyId === t.id}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    <Icon size={14} /> {flow.label}
                  </button>
                )}
                {t.status === 'done' && (
                  <span className="text-green-400 text-xs font-semibold shrink-0">Done</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
