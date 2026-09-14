import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { BarChart3 } from 'lucide-react'
import PageShell from '../components/PageShell'


export default function AnalyticsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: teams } = await supabase.from('teams').select('id, name').order('name')
      const { data: profiles } = await supabase.from('profiles').select('id, team_id').eq('status', 'active')
      const { data: tasks } = await supabase.from('tasks').select('assigned_to, status')
      const { data: rsvps } = await supabase.from('portal_event_rsvps').select('profile_id, status')

      const profileTeam = {}
      for (const p of profiles ?? []) profileTeam[p.id] = p.team_id

      const stats = (teams ?? []).map((team) => {
        const memberIds = new Set((profiles ?? []).filter((p) => p.team_id === team.id).map((p) => p.id))
        const teamTasks = (tasks ?? []).filter((t) => memberIds.has(t.assigned_to))
        const teamRsvps = (rsvps ?? []).filter((r) => memberIds.has(r.profile_id))

        const confirmed = teamTasks.filter((t) => t.status === 'confirmed').length
        const attended = teamRsvps.filter((r) => r.status === 'attended').length

        return {
          id: team.id,
          name: team.name,
          memberCount: memberIds.size,
          taskCompletionRate: teamTasks.length ? Math.round((confirmed / teamTasks.length) * 100) : null,
          taskCount: teamTasks.length,
          attendanceRate: teamRsvps.length ? Math.round((attended / teamRsvps.length) * 100) : null,
          rsvpCount: teamRsvps.length,
        }
      })
      setRows(stats)
      setLoading(false)
    }
    load()
  }, [])

  const barColor = (pct) => (pct === null ? 'bg-foreground/10' : pct >= 70 ? 'bg-green-400' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400')

  return (
    <PageShell>

        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="text-primary" size={28} />
          <h1 className="text-2xl font-black uppercase tracking-tight glow-text">Team Analytics</h1>
        </div>

        {loading ? (
          <p className="text-foreground/40 text-sm">Loading…</p>
        ) : (
          <div className="space-y-4">
            {rows.map((t) => (
              <div key={t.id} className="glass p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-foreground/40 text-xs">{t.memberCount} member{t.memberCount === 1 ? '' : 's'}</p>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-foreground/50 mb-1">
                    <span>Task completion ({t.taskCount})</span>
                    <span>{t.taskCompletionRate === null ? '—' : `${t.taskCompletionRate}%`}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-foreground/5 overflow-hidden">
                    <div className={`h-full ${barColor(t.taskCompletionRate)}`} style={{ width: `${t.taskCompletionRate ?? 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-foreground/50 mb-1">
                    <span>Event attendance ({t.rsvpCount})</span>
                    <span>{t.attendanceRate === null ? '—' : `${t.attendanceRate}%`}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-foreground/5 overflow-hidden">
                    <div className={`h-full ${barColor(t.attendanceRate)}`} style={{ width: `${t.attendanceRate ?? 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageShell>
  )
}
