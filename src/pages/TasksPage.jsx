import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { ClipboardList, Plus, X, Pencil, Trash2, AlertTriangle, Filter } from 'lucide-react'
import PageShell from '../components/PageShell'
import ConfirmDialog from '../components/ConfirmDialog'
import { canLead } from '../lib/permissions'
import { BOARD_COLUMNS } from '../lib/taskStatus'

const PRIORITY_OPTIONS = [
  { key: 'low', label: 'Low', color: 'text-foreground/40' },
  { key: 'medium', label: 'Medium', color: 'text-amber-400' },
  { key: 'high', label: 'High', color: 'text-red-400' },
]

const PRIORITY_ICON = {
  low: '○',
  medium: '◐',
  high: '●',
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TasksPage() {
  const { profile } = useAuth()
  const isLeader = canLead(profile)

  const [tasks, setTasks] = useState([])
  const [teams, setTeams] = useState([])
  const [allMembers, setAllMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [boardFilter, setBoardFilter] = useState('all')

  // Modal states
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  // Mobile column toggle
  const [mobileCol, setMobileCol] = useState('todo')

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  const load = async () => {
    setLoading(true)

    const { data: teamRows } = await supabase
      .from('teams')
      .select('id, name')
      .order('name')
    setTeams(teamRows ?? [])

    const { data: memberRows } = await supabase
      .from('profiles')
      .select('id, full_name, team_id, teams!profiles_team_id_fkey(name)')
      .eq('status', 'active')
      .order('full_name')
    setAllMembers(memberRows ?? [])

    let query = supabase
      .from('tasks')
      .select('id, title, description, status, assigned_to, priority, points, team_id, created_at')
      .order('created_at', { ascending: false })

    if (!isLeader) query = query.eq('assigned_to', profile.id)
    else if (profile?.role === 'leader') query = query.eq('team_id', profile.team_id)

    const { data: rows } = await query
    let enriched = rows ?? []

    if (boardFilter !== 'all') {
      enriched = enriched.filter((t) => t.team_id === boardFilter)
    }

    // Attach human-readable names (cheap in-memory lookup)
    const memberMap = Object.fromEntries(memberRows?.map((m) => [m.id, m]) ?? [])
    const teamMap = Object.fromEntries(teamRows?.map((t) => [t.id, t]) ?? [])
    enriched = enriched.map((t) => ({
      ...t,
      _assignee: memberMap[t.assigned_to]?.full_name ?? null,
      _team: teamMap[t.team_id]?.name ?? null,
    }))

    setTasks(enriched)
    setLoading(false)
  }

  useEffect(() => { if (profile?.id) load() }, [profile?.id])

  // -----------------------------------------------------------------------
  // CRUD handlers
  // -----------------------------------------------------------------------

  const handleStatusChange = async (taskId, newStatus) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))
  }

  const handleEdit = (task) => { setSelectedTask(task); setShowForm(true) }
  const handleDelete = (task) => { setSelectedTask(task); setShowDeleteConfirm(true) }

  const afterFormAction = () => { setShowForm(false); setSelectedTask(null); load() }
  const afterDelete = () => { setShowDeleteConfirm(false); setSelectedTask(null); load() }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const boardTeams = [
    ...new Map(
      tasks.filter((t) => t.team_id).map((t) => [t.team_id, { id: t.team_id, name: t._team }])
    ).values(),
  ]

  return (
    <>
      <PageShell>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ClipboardList className="text-primary" size={28} />
            <h1 className="text-2xl font-black uppercase tracking-tight glow-text">Tasks</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isLeader && (
              <button onClick={() => { setSelectedTask(null); setShowForm(true) }}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
                <Plus size={14} /> New Task
              </button>
            )}
          </div>
        </div>

        {/* Board filter */}
        {isLeader && boardTeams.length > 0 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Filter size={13} className="text-foreground/40" />
            <button onClick={() => setBoardFilter('all')}
              className={`glass-pill text-xs px-3 py-1.5 transition-colors ${boardFilter === 'all' ? 'bg-primary/20 text-primary' : 'text-foreground/50 hover:text-foreground/80'}`}>
              All
            </button>
            {boardTeams.map((t) => (
              <button key={t.id} onClick={() => setBoardFilter(t.id)}
                className={`glass-pill text-xs px-3 py-1.5 transition-colors ${boardFilter === t.id ? 'bg-primary/20 text-primary' : 'text-foreground/50 hover:text-foreground/80'}`}>
                {t.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-foreground/40 text-sm">Loading tasks…</p>
        ) : (
          <>
            {/* Mobile: column selector */}
            <div className="flex gap-1 mb-4 sm:hidden">
              {BOARD_COLUMNS.map((s) => (
                <button key={s.key} onClick={() => setMobileCol(s.key)}
                  className={`flex-1 text-xs py-2 rounded-lg transition-colors font-semibold uppercase tracking-wide
                    ${mobileCol === s.key ? 'bg-primary/20 text-primary' : 'glass text-foreground/50'}`}>
                  {s.label}
                  <span className="ml-1 opacity-60">
                    {tasks.filter((t) => t.status === s.key).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Desktop board */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-4">
              {BOARD_COLUMNS.map((s) => (
                <BoardColumn key={s.key} status={s} tasks={tasks}
                  isLeader={isLeader} onStatusChange={handleStatusChange}
                  onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>

            {/* Mobile single column */}
            <div className="sm:hidden">
              <BoardColumn
                status={BOARD_COLUMNS.find((s) => s.key === mobileCol)}
                tasks={tasks.filter((t) => t.status === mobileCol)}
                isLeader={isLeader} onStatusChange={handleStatusChange}
                onEdit={handleEdit} onDelete={handleDelete} />
            </div>
          </>
        )}
      </PageShell>

      {showForm && (
        <TaskFormModal
          task={selectedTask} teams={teams} allMembers={allMembers} profile={profile}
          onClose={afterFormAction} onSaved={afterFormAction} />
      )}

      {showDeleteConfirm && selectedTask && (
        <ConfirmDialog
          title="Delete Task"
          body={<>Delete "<span className="font-semibold">{selectedTask.title}</span>"? This cannot be undone.</>}
          icon={<AlertTriangle size={20} className="text-red-400" />}
          confirmLabel="Delete"
          busyLabel="Deleting…"
          busy={deleting}
          onCancel={afterDelete}
          onConfirm={async () => {
            setDeleting(true)
            await supabase.from('tasks').delete().eq('id', selectedTask.id)
            setDeleting(false)
            afterDelete()
          }}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Board column
// ---------------------------------------------------------------------------

function BoardColumn({ status, tasks, isLeader, onStatusChange, onEdit, onDelete }) {
  const items = tasks.filter((t) => t.status === status.key)

  return (
    <div className="glass p-3 rounded-xl min-h-[120px]">
      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-3 px-1">
        {status.label} <span className="opacity-60">({items.length})</span>
      </h3>

      {items.length === 0 ? (
        <p className="text-foreground/20 text-xs text-center py-6">No tasks</p>
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <TaskCard key={t.id} task={t} isLeader={isLeader}
              onStatusChange={onStatusChange} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Task card
// ---------------------------------------------------------------------------

function TaskCard({ task, isLeader, onStatusChange, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const priority = PRIORITY_OPTIONS.find((p) => p.key === task.priority) ?? PRIORITY_OPTIONS[1]

  return (
    <div className="glass p-3 rounded-lg group relative">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="font-semibold text-sm leading-snug">{task.title}</p>
        {isLeader && (
          <div className="relative shrink-0">
            <button onClick={() => setShowMenu((p) => !p)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-foreground/30 hover:text-foreground/70 hover:bg-foreground/5 transition-colors"
              aria-label="Task actions">
              ⋮
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-background border border-foreground/10 rounded-xl py-1.5 z-50 min-w-[150px] shadow-xl shadow-black/20">
                  <button onClick={() => { onEdit(task); setShowMenu(false) }}
                    className="w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2.5 text-foreground/70 hover:text-foreground hover:bg-primary/10 transition-colors rounded-lg mx-0.5">
                    <Pencil size={13} /> Edit
                  </button>
                  <div className="mx-3 my-1 border-t border-foreground/10" />
                  <button onClick={() => { onDelete(task); setShowMenu(false) }}
                    className="w-full text-left px-3.5 py-2.5 text-xs flex items-center gap-2.5 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors rounded-lg mx-0.5">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-foreground/50 text-xs mb-2 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px] text-foreground/40">
        <span className={`${priority.color} font-semibold`}>
          {PRIORITY_ICON[task.priority ?? 'medium']} {priority.label}
        </span>
        {task._team && <span>{task._team}</span>}
        {task._assignee && <span>→ {task._assignee}</span>}
        {task.points != null && task.points > 0 && <span className="text-primary">{task.points} pts</span>}
      </div>

      {isLeader && (
        <div className="mt-2 pt-2 border-t border-foreground/5 flex gap-1">
          {BOARD_COLUMNS.filter((s) => s.key !== task.status).slice(0, 2).map((s) => (
            <button key={s.key} onClick={() => onStatusChange(task.id, s.key)}
              className="glass-pill text-[10px] px-2 py-1 text-foreground/40 hover:text-foreground/70 hover:bg-primary/10 transition-colors capitalize">
              → {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Task create / edit modal
// ---------------------------------------------------------------------------

function TaskFormModal({ task, teams, allMembers, profile, onClose, onSaved }) {
  const isEdit = !!task
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [teamId, setTeamId] = useState(task?.team_id ?? (profile?.role === 'leader' ? profile.team_id : ''))
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to ?? '')
  const [priority, setPriority] = useState(task?.priority ?? 'medium')
  const [points, setPoints] = useState(task?.points ?? 0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const filteredMembers = teamId
    ? allMembers.filter((m) => m.team_id === teamId)
    : allMembers

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Title is required'); return }
    if (!teamId) { setError('Select a committee'); return }
    setSubmitting(true)

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      team_id: teamId || null,
      assigned_to: assignedTo || null,
      priority,
      points: Number(points) || 0,
    }

    const { error: err } = isEdit
      ? await supabase.from('tasks').update(payload).eq('id', task.id)
      : await supabase.from('tasks').insert({ ...payload, status: 'todo', assigned_by: profile.id })

    if (err) { setSubmitting(false); setError(err.message); return }

    // Send notifications on new task creation
    if (!isEdit && assignedTo) {
      const assigneeName = allMembers.find((m) => m.id === assignedTo)?.full_name ?? 'A member'
      const taskTitle = title.trim()

      // Notify the assigned member
      await supabase.from('notifications').insert({
        user_id: assignedTo,
        message: `You have been assigned a new task: "${taskTitle}"`,
        link: '/tasks',
      })

      // Notify all excom/admin members
      const { data: managers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['excom', 'admin'])
        .neq('id', profile.id)

      if (managers?.length) {
        await supabase.from('notifications').insert(
          managers.map((m) => ({
            user_id: m.id,
            message: `${assigneeName} has been assigned a new task: "${taskTitle}"`,
            link: '/tasks',
          }))
        )
      }
    }

    setSubmitting(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50" onClick={onClose}>
      <div className="glass p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground/70 transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input type="text" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus
            className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm" />

          <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm resize-none" />

          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="text-[10px] text-foreground/40 uppercase tracking-wider mb-1 block">Committee</label>
              <select value={teamId} onChange={(e) => { setTeamId(e.target.value); setAssignedTo('') }}
                className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm">
                <option value="" className="bg-background">Any / None</option>
                {teams.map((t) => <option key={t.id} value={t.id} className="bg-background">{t.name}</option>)}
              </select>
            </div>
            <div className="w-1/2">
              <label className="text-[10px] text-foreground/40 uppercase tracking-wider mb-1 block">Assign to</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm">
                <option value="" className="bg-background">Unassigned</option>
                {filteredMembers.map((m) => (
                  <option key={m.id} value={m.id} className="bg-background">{m.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="text-[10px] text-foreground/40 uppercase tracking-wider mb-1 block">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm">
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.key} value={p.key} className="bg-background">{p.label}</option>
                ))}
              </select>
            </div>
            <div className="w-1/2">
              <label className="text-[10px] text-foreground/40 uppercase tracking-wider mb-1 block">Points</label>
              <input type="number" min={0} value={points} onChange={(e) => setPoints(e.target.value)}
                className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm" />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 glass-pill py-2.5 text-sm hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-50">
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

