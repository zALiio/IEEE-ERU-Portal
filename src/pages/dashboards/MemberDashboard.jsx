import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Circle, PlayCircle, Send, Clock, CheckCircle2, Award, Trophy } from 'lucide-react'

const STATUS_FLOW = {
  todo: { next: 'in_progress', label: 'Start', icon: PlayCircle },
  in_progress: { next: 'submitted', label: 'Submit', icon: Send },
  submitted: null,
  confirmed: null,
}

const STATUS_STYLES = {
  todo: 'text-white/40',
  in_progress: 'text-amber-400',
  submitted: 'text-blue-400',
  confirmed: 'text-green-400',
}

const STATUS_LABELS = {
  submitted: 'Awaiting confirmation',
  confirmed: 'Confirmed',
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

    let proofUrl = task.proof_url
    if (next === 'submitted') {
      proofUrl = window.prompt('Paste your Drive link with the completed work:')
      if (!proofUrl) return
    }

    setBusyId(task.id)

    const { error } = await supabase
      .from('tasks')
      .update({ status: next, proof_url: proofUrl })
      .eq('id', task.id)

    if (!error) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next, proof_url: proofUrl } : t)))
    }
    setBusyId(null)
  }

  // Points only change once a Leader/Excom/Admin confirms a task, so refresh
  // the profile whenever we notice a task has moved to 'confirmed' since we
  // last loaded it (covers the case where it was confirmed while this page
  // was open).
  useEffect(() => {
    if (tasks.some((t) => t.status === 'confirmed')) {
      refreshProfile()
    }
  }, [tasks])

  return (
    <div className="w-full max-w-2xl">
      <div className="glass p-6 mb-6 flex items-center justify-between">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-[0.2em]">Total Points</p>
          <p className="text-3xl font-black glow-text">{profile?.points ?? 0}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/leaderboard"
            className="glass-pill p-3 hover:bg-primary/10 transition-colors"
            aria-label="Leaderboard"
          >
            <Trophy size={20} className="text-primary" />
          </Link>
          <Award className="text-primary" size={32} />
        </div>
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
                  {t.status === 'in_progress' && t.reject_note && (
                    <p className="text-red-400 text-xs mt-1">Rejected: {t.reject_note}</p>
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
                {t.status === 'submitted' && (
                  <span className={`text-xs font-semibold shrink-0 flex items-center gap-1.5 ${STATUS_STYLES.submitted}`}>
                    <Clock size={14} /> {STATUS_LABELS.submitted}
                  </span>
                )}
                {t.status === 'confirmed' && (
                  <span className={`text-xs font-semibold shrink-0 flex items-center gap-1.5 ${STATUS_STYLES.confirmed}`}>
                    <CheckCircle2 size={14} /> {STATUS_LABELS.confirmed}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
