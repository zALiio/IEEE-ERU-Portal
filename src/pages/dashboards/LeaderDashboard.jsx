import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { Users, Plus, X, BookUser, ClipboardCheck, Check, Trophy } from 'lucide-react'

export default function LeaderDashboard() {
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [points, setPoints] = useState(10)
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  const assignTask = async (e) => {
    e.preventDefault()
    setError('')
    if (!assignedTo) {
      setError('Pick a team member')
      return
    }
    setSubmitting(true)

    const { error } = await supabase.from('tasks').insert({
      assigned_to: assignedTo,
      assigned_by: profile.id,
      title,
      description: description || null,
      points: Number(points),
      due_date: dueDate || null,
    })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }

    setTitle('')
    setDescription('')
    setPoints(10)
    setAssignedTo('')
    setDueDate('')
    setShowForm(false)
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-primary" size={24} />
          <h2 className="text-lg font-bold uppercase tracking-tight text-white/70">
            {profile?.teams?.name ?? 'Your Team'}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/leaderboard" className="glass-pill text-xs px-4 py-2 flex items-center gap-2 hover:bg-primary/10 transition-colors">
            <Trophy size={14} /> Leaderboard
          </Link>
          <Link to="/directory" className="glass-pill text-xs px-4 py-2 flex items-center gap-2 hover:bg-primary/10 transition-colors">
            <BookUser size={14} /> Directory
          </Link>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-2"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancel' : 'Assign Task'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={assignTask} className="glass p-6 mb-6 space-y-3">
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            required
            className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm"
          >
            <option value="" disabled>Assign to…</option>
            {members.filter((m) => m.id !== profile.id).map((m) => (
              <option key={m.id} value={m.id} className="bg-background">{m.full_name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm resize-none"
          />
          <div className="flex gap-3">
            <input
              type="number"
              min={0}
              placeholder="Points"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-1/2 glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm"
            />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-1/2 glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full text-sm disabled:opacity-50">
            {submitting ? 'Assigning…' : 'Assign Task'}
          </button>
        </form>
      )}

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
              const assignee = members.find((m) => m.id === t.assigned_to)
              return (
                <div key={t.id} className="glass p-5 flex items-center justify-between gap-4 border border-blue-400/20">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{t.title}</p>
                    <p className="text-white/40 text-xs mt-1">
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
              )
            })}
          </div>
        </div>
      )}

      {error && !showForm && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {loading ? (
        <p className="text-white/40 text-sm">Loading…</p>
      ) : members.length === 0 ? (
        <div className="glass p-8 text-center">
          <p className="text-white/40 text-sm">No active members on your team yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="glass p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold">{m.full_name}</p>
                <p className="text-white/40 text-xs uppercase tracking-wide">{m.role}</p>
              </div>
              <p className="text-primary font-bold">{m.points} pts</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
