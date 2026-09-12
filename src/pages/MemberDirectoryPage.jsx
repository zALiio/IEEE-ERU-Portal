import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import {
  Sun, Moon, ArrowLeft, Users, ChevronRight, X, Plus, Minus,
  AlertTriangle, UserX, Shuffle, ShieldCheck,
} from 'lucide-react'
import { FadeIn } from '../components/FadeIn'


const ROLE_OPTIONS = ['member', 'leader', 'excom', 'admin']
const FOUNDER_ROLES = ['excom', 'admin']

export default function MemberDirectoryPage() {
  const { isDark, toggleTheme } = useTheme()
  const { profile: myProfile } = useAuth()
  const [members, setMembers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const canManage = myProfile?.role === 'excom' || myProfile?.role === 'admin'

  const loadMembers = async () => {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('id, full_name, role, points, team_id, teams!profiles_team_id_fkey(name)')
      .eq('status', 'active')
      .order('full_name')

    if (myProfile?.role === 'leader') {
      query = query.eq('team_id', myProfile.team_id)
    }

    const { data } = await query
    const { data: leadRows } = await supabase.from('team_leads').select('profile_id, position')
    const positionByProfile = {}
    for (const l of leadRows ?? []) positionByProfile[l.profile_id] = l.position

    setMembers((data ?? []).map((m) => ({ ...m, leadPosition: positionByProfile[m.id] ?? null })))
    setLoading(false)
  }

  useEffect(() => {
    if (myProfile) {
      loadMembers()
      supabase.from('teams').select('id, name').order('name').then(({ data }) => setTeams(data ?? []))
    }
  }, [myProfile])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-16 relative">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 glass-pill hover:bg-primary/10 transition-colors z-10"
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

        <div className="flex items-center gap-3 mb-8">
          <Users className="text-primary" size={28} />
          <h1 className="text-2xl font-black uppercase tracking-tight glow-text">
            Member Directory
          </h1>
        </div>

        {loading ? (
          <p className="text-foreground/40 text-sm">Loading…</p>
        ) : members.length === 0 ? (
          <div className="glass p-8 text-center">
            <p className="text-foreground/40 text-sm">No active members to show.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className="w-full glass p-5 flex items-center justify-between text-left hover:bg-primary/5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{m.full_name}</p>
                  <p className="text-foreground/40 text-xs uppercase tracking-wide truncate">
                    {m.role}{m.leadPosition ? ` (${m.leadPosition === 'head' ? 'Head' : 'Vice Head'})` : ''} · {m.teams?.name ?? 'No team'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-primary font-bold">{m.points} pts</p>
                  <ChevronRight size={16} className="text-foreground/30" />
                </div>
              </button>
            ))}
          </div>
        )}
      </FadeIn>

      {selected && (
        <MemberDetailModal
          member={selected}
          teams={teams}
          canManage={canManage}
          isAdmin={myProfile?.role === 'admin'}
          onClose={() => setSelected(null)}
          onMemberChanged={() => {
            setSelected(null)
            loadMembers()
          }}
        />
      )}
    </div>
  )
}

function MemberDetailModal({ member, teams, canManage, isAdmin, onClose, onMemberChanged }) {
  const [tasks, setTasks] = useState([])
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustNote, setAdjustNote] = useState('')

  const [newRole, setNewRole] = useState(member.role)
  const [newTeam, setNewTeam] = useState(member.team_id ?? '')
  const [newPosition, setNewPosition] = useState(member.leadPosition ?? 'vice_head')

  const [confirmAction, setConfirmAction] = useState(null) // 'warning1' | 'warning2' | 'terminate' | null

  const availableRoles = isAdmin ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r !== 'admin')
  // Team transfer should only be hidden if the member is CURRENTLY an excom/admin
  // (they don't belong to teams). Current member/leader roles CAN be transferred.
  const memberHasNoTeam = FOUNDER_ROLES.includes(member.role)
  // The "no team assignment" note should appear when NEW role is excom/admin
  const newRoleHasNoTeam = FOUNDER_ROLES.includes(newRole)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: taskRows }, { data: logRows }] = await Promise.all([
        supabase.from('tasks').select('*').eq('assigned_to', member.id).order('created_at', { ascending: false }),
        supabase.from('points_log').select('*').eq('profile_id', member.id).order('created_at', { ascending: false }),
      ])
      setTasks(taskRows ?? [])
      setLog(logRows ?? [])
      setLoading(false)
    }
    load()
  }, [member.id])

  const syncTeamLead = async (profileId, role, teamId, position = 'vice_head') => {
    await supabase.from('team_leads').delete().eq('profile_id', profileId)
    if (role === 'leader' && teamId) {
      const { error } = await supabase.from('team_leads').insert({ profile_id: profileId, team_id: teamId, position })
      if (error) return error
    }
    return null
  }

  const submitAdjustment = async (e) => {
    e.preventDefault()
    setError('')
    const amount = Number(adjustAmount)
    if (!amount || !adjustNote.trim()) {
      setError('Enter an amount and a note')
      return
    }
    setBusy(true)

    const { error: logError } = await supabase.from('points_log').insert({
      task_id: null,
      profile_id: member.id,
      points: amount,
      note: adjustNote.trim(),
      entry_type: 'adjustment',
    })
    if (logError) { setError(logError.message); setBusy(false); return }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ points: member.points + amount })
      .eq('id', member.id)

    setBusy(false)
    if (profileError) { setError(profileError.message); return }

    setAdjustAmount('')
    setAdjustNote('')
    onMemberChanged()
  }

  const applyRoleChange = async () => {
    setError('')
    const positionOnlyChange = newRole === 'leader' && newRole === member.role && newPosition !== (member.leadPosition ?? 'vice_head')
    if (newRole === member.role && !positionOnlyChange) return
    setBusy(true)

    // Excom and Admin are the founders' roles and don't belong to any of the
    // 6 operational teams, so promoting into either clears team_id (and pulls
    // them out of team_leads if they were a Leader) automatically.
    const isFounderRole = FOUNDER_ROLES.includes(newRole)
    const effectiveTeamId = isFounderRole ? null : member.team_id

    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: newRole, team_id: effectiveTeamId })
      .eq('id', member.id)

    if (roleError) { setError(roleError.message); setBusy(false); return }

    const leadError = await syncTeamLead(member.id, newRole, effectiveTeamId, newPosition)
    setBusy(false)
    if (leadError) { setError(newRole === 'leader' ? `Role updated, but: ${leadError.message} (this team may already have a Head)` : leadError.message); return }
    onMemberChanged()
  }

  const applyTeamTransfer = async () => {
    setError('')
    if (!newTeam || newTeam === member.team_id) return
    setBusy(true)

    const { error: teamError } = await supabase
      .from('profiles')
      .update({ team_id: newTeam })
      .eq('id', member.id)

    if (teamError) { setError(teamError.message); setBusy(false); return }

    await syncTeamLead(member.id, member.role, newTeam, newPosition)
    setBusy(false)
    onMemberChanged()
  }

  const issueWarning = async (level) => {
    setError('')
    setBusy(true)
    const amount = level === 1 ? -10 : -25
    const label = level === 1 ? 'First Warning' : 'Second Warning'

    const { error: logError } = await supabase.from('points_log').insert({
      task_id: null,
      profile_id: member.id,
      points: amount,
      note: `${label} issued — ${Math.abs(amount)} points deducted`,
      entry_type: 'warning',
    })
    if (logError) { setError(logError.message); setBusy(false); return }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ points: member.points + amount })
      .eq('id', member.id)

    setBusy(false)
    setConfirmAction(null)
    if (profileError) { setError(profileError.message); return }
    onMemberChanged()
  }

  const terminate = async () => {
    setError('')
    setBusy(true)

    const { error: termError } = await supabase
      .from('profiles')
      .update({ status: 'terminated' })
      .eq('id', member.id)

    if (termError) { setError(termError.message); setBusy(false); return }

    await supabase.from('team_leads').delete().eq('profile_id', member.id)

    setBusy(false)
    setConfirmAction(null)
    onMemberChanged()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50" onClick={onClose}>
      <div className="glass p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight glow-text">{member.full_name}</h2>
            <p className="text-foreground/40 text-xs uppercase tracking-wide mt-1">
              {member.role}{member.leadPosition ? ` (${member.leadPosition === 'head' ? 'Head' : 'Vice Head'})` : ''} · {member.teams?.name ?? 'No team'}
            </p>
          </div>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground/70 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="glass p-4 mb-6 flex items-center justify-between">
          <span className="text-foreground/50 text-xs uppercase tracking-[0.2em]">Total Points</span>
          <span className="text-2xl font-black text-primary">{member.points}</span>
        </div>

        {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

        {canManage && (
          <>
            {/* Role change */}
            <div className="glass p-4 mb-4">
              <p className="text-foreground/50 text-xs uppercase tracking-wide mb-2 flex items-center gap-2">
                <ShieldCheck size={13} /> Change Role
              </p>
              <div className="flex gap-2">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="flex-1 glass-pill px-3 py-2 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r} className="bg-background">
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={applyRoleChange}
                  disabled={busy || (newRole === member.role && !(newRole === 'leader' && newPosition !== (member.leadPosition ?? 'vice_head')))}
                  className="btn-primary px-4 text-sm disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
              {newRoleHasNoTeam && (
                <p className="text-foreground/30 text-[10px] uppercase tracking-wide mt-2">
                  Excom & Admin are founders' roles — no team assignment
                </p>
              )}
              {newRole === 'leader' && (
                <div className="mt-3">
                  <p className="text-foreground/50 text-xs uppercase tracking-wide mb-2">Position</p>
                  <select
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    className="w-full glass-pill px-3 py-2 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm"
                  >
                    <option value="head" className="bg-background">Head</option>
                    <option value="vice_head" className="bg-background">Vice Head</option>
                  </select>
                </div>
              )}
            </div>

            {/* Team transfer — hidden entirely for Excom/Admin, who don't belong to any team */}
            {!memberHasNoTeam && (
              <div className="glass p-4 mb-4">
                <p className="text-foreground/50 text-xs uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Shuffle size={13} /> Transfer Team
                </p>
                <div className="flex gap-2">
                  <select
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    className="flex-1 glass-pill px-3 py-2 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id} className="bg-background">{t.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={applyTeamTransfer}
                    disabled={busy || newTeam === member.team_id}
                    className="btn-primary px-4 text-sm disabled:opacity-40"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {/* Points adjustment */}
            <form onSubmit={submitAdjustment} className="glass p-4 mb-4 space-y-2">
              <p className="text-foreground/50 text-xs uppercase tracking-wide mb-2">Adjust Points</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="+10 or -5"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-28 glass-pill px-3 py-2 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm"
                />
                <input
                  type="text"
                  placeholder="Reason (required)"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="flex-1 glass-pill px-3 py-2 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary px-4 text-sm flex items-center gap-1 disabled:opacity-50"
                >
                  {Number(adjustAmount) < 0 ? <Minus size={14} /> : <Plus size={14} />}
                </button>
              </div>
            </form>

            {/* Warnings + termination */}
            <div className="glass p-4 mb-6">
              <p className="text-foreground/50 text-xs uppercase tracking-wide mb-3 flex items-center gap-2">
                <AlertTriangle size={13} /> Disciplinary Actions
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setConfirmAction('warning1')}
                  disabled={busy}
                  className="glass-pill px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-40"
                >
                  Issue First Warning (-10)
                </button>
                <button
                  onClick={() => setConfirmAction('warning2')}
                  disabled={busy}
                  className="glass-pill px-3 py-2 text-xs text-orange-400 hover:bg-orange-500/10 transition-colors disabled:opacity-40"
                >
                  Issue Second Warning (-25)
                </button>
                <button
                  onClick={() => setConfirmAction('terminate')}
                  disabled={busy}
                  className="glass-pill px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 flex items-center gap-1"
                >
                  <UserX size={13} /> Terminate
                </button>
              </div>
            </div>
          </>
        )}

        {loading ? (
          <p className="text-foreground/40 text-sm">Loading…</p>
        ) : (
          <>
            <p className="text-foreground/50 text-xs uppercase tracking-wide mb-2">Tasks</p>
            <div className="space-y-2 mb-6">
              {tasks.length === 0 && <p className="text-foreground/30 text-xs">No tasks yet.</p>}
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                  <span className="truncate">{t.title}</span>
                  <span className="text-foreground/40 text-xs uppercase shrink-0 ml-2">{t.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>

            <p className="text-foreground/50 text-xs uppercase tracking-wide mb-2">Points History</p>
            <div className="space-y-2">
              {log.length === 0 && <p className="text-foreground/30 text-xs">No history yet.</p>}
              {log.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm py-1.5 border-b border-white/5">
                  <div className="min-w-0 flex-1">
                    <span className="truncate block">{l.note}</span>
                    {l.entry_type && l.entry_type !== 'adjustment' && (
                      <span className={`text-[10px] uppercase tracking-wide ${l.entry_type === 'warning' ? 'text-orange-400' : 'text-foreground/30'}`}>
                        {l.entry_type}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-semibold shrink-0 ml-2 ${l.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {l.points >= 0 ? '+' : ''}{l.points}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {confirmAction && (
        <ConfirmDialog
          action={confirmAction}
          memberName={member.full_name}
          busy={busy}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction === 'warning1') issueWarning(1)
            if (confirmAction === 'warning2') issueWarning(2)
            if (confirmAction === 'terminate') terminate()
          }}
        />
      )}
    </div>
  )
}

function ConfirmDialog({ action, memberName, busy, onCancel, onConfirm }) {
  const copy = {
    warning1: {
      title: 'Issue First Warning?',
      body: `${memberName} will receive a first warning and lose 10 points.`,
      confirmLabel: 'Issue Warning',
      confirmClass: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30',
    },
    warning2: {
      title: 'Issue Second Warning?',
      body: `${memberName} will receive a second warning and lose 25 points.`,
      confirmLabel: 'Issue Warning',
      confirmClass: 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30',
    },
    terminate: {
      title: 'Terminate Member?',
      body: `${memberName} will be marked terminated, immediately blocked from logging in, and hidden from active lists. This can be reversed later directly in the database if needed.`,
      confirmLabel: 'Terminate',
      confirmClass: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
    },
  }[action]

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-[60]" onClick={onCancel}>
      <div className="glass p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-2">{copy.title}</h3>
        <p className="text-foreground/60 text-sm mb-6">{copy.body}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 glass-pill py-2.5 text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${copy.confirmClass}`}
          >
            {busy ? 'Working…' : copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}