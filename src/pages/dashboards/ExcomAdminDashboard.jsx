import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { Building2, Users, BookUser } from 'lucide-react'

export default function ExcomAdminDashboard() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: teamRows } = await supabase.from('teams').select('id, name').order('name')
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('team_id, points, status')
        .eq('status', 'active')

      const withStats = (teamRows ?? []).map((team) => {
        const members = (profileRows ?? []).filter((p) => p.team_id === team.id)
        return {
          ...team,
          memberCount: members.length,
          totalPoints: members.reduce((sum, m) => sum + (m.points ?? 0), 0),
        }
      })

      setTeams(withStats)
      setLoading(false)
    }
    load()
  }, [])

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
          <Link to="/directory" className="glass-pill text-xs px-4 py-2 flex items-center gap-2 hover:bg-primary/10 transition-colors">
            <BookUser size={14} /> Directory
          </Link>
          <Link to="/approve" className="btn-primary text-xs px-4 py-2 flex items-center gap-2">
            <Users size={14} /> Approve Members
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-white/40 text-sm">Loading…</p>
      ) : (
        <div className="space-y-3">
          {teams.map((t) => (
            <div key={t.id} className="glass p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-white/40 text-xs">{t.memberCount} active member{t.memberCount === 1 ? '' : 's'}</p>
              </div>
              <p className="text-primary font-bold">{t.totalPoints} pts</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
