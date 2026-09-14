import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Circle, Clock, CheckCircle2, Award, Trophy, Calendar, ClipboardList } from 'lucide-react'
import { FadeIn, Stagger, StaggerItem } from '../../components/FadeIn'
import SectionLabel from '../../components/SectionLabel'
import AnimatedNumber from '../../components/AnimatedNumber'
import MembersMarquee from '../../components/MembersMarquee'
import { STATUS_FLOW, STATUS_STYLES, STATUS_LABELS } from '../../lib/taskStatus'

const isOverdue = (task) =>
  task.due_date && task.status !== 'submitted' && task.status !== 'confirmed' && new Date(task.due_date) < new Date().setHours(0, 0, 0, 0)

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
    <div className="w-full max-w-4xl">
      <FadeIn>
        <div className="glass stat-card p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-foreground/50 text-xs uppercase tracking-[0.2em]">Total Points</p>
          <p className="text-3xl font-black glow-text">
            <AnimatedNumber value={profile?.points ?? 0} />
          </p>
        </div>
        <div className="flex items-center gap-3 justify-center sm:justify-end">
          <Link
            to="/tasks"
            className="glass-pill p-3 hover:bg-primary/10 transition-colors"
            aria-label="Tasks"
          >
            <ClipboardList size={20} className="text-primary" />
          </Link>
          <Link
            to="/events"
            className="glass-pill p-3 hover:bg-primary/10 transition-colors"
            aria-label="Events"
          >
            <Calendar size={20} className="text-primary" />
          </Link>
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
      </FadeIn>

      <div className="mb-3">
        <SectionLabel>Your Tasks</SectionLabel>
      </div>

      {loading ? (
        <p className="text-foreground/40 text-sm">Loading…</p>
      ) : tasks.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-foreground/40 text-sm">No tasks assigned yet.</p>
        </div>
      ) : (
        <Stagger className="space-y-3">
          {tasks.map((t) => {
            const flow = STATUS_FLOW[t.status]
            const Icon = flow?.icon
            return (
              <StaggerItem key={t.id}>
                <div className={`glass p-5 flex items-center justify-between gap-4 ${isOverdue(t) ? 'border border-red-500/40' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Circle size={8} className={`fill-current ${STATUS_STYLES[t.status]}`} />
                      <p className="font-semibold truncate">{t.title}</p>
                    </div>
                    {t.description && (
                      <p className="text-foreground/40 text-xs mt-1 truncate">{t.description}</p>
                    )}
                    {t.status === 'in_progress' && t.reject_note && (
                      <p className="text-red-400 text-xs mt-1">Rejected: {t.reject_note}</p>
                    )}
                    <p className={`text-xs mt-1 ${isOverdue(t) ? 'text-red-400 font-semibold' : 'text-foreground/30'}`}>
                      {t.points} pts{t.due_date ? ` · due ${t.due_date}${isOverdue(t) ? ' (overdue)' : ''}` : ''}
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
              </StaggerItem>
            )
          })}
        </Stagger>
      )}

      <MembersMarquee className="mt-12" />
    </div>
  )
}
