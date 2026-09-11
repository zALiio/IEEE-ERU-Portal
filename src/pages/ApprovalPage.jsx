import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Sun, Moon, ArrowLeft, Check, X, Users } from 'lucide-react'
import { FadeIn } from '../components/FadeIn'

const ROLE_OPTIONS = ['member', 'leader', 'excom', 'admin']

export default function ApprovalPage() {
  const { isDark, toggleTheme } = useTheme()
  const { profile: myProfile } = useAuth()
  const [pending, setPending] = useState([])
  const [roleChoice, setRoleChoice] = useState({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const canGrantAdmin = myProfile?.role === 'admin'
  const availableRoles = canGrantAdmin ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r !== 'admin')

  const loadPending = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, team_id, created_at, teams!profiles_team_id_fkey(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setPending(data ?? [])
      const defaults = {}
      ;(data ?? []).forEach((p) => { defaults[p.id] = 'member' })
      setRoleChoice((prev) => ({ ...defaults, ...prev }))
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPending()
  }, [])

  const approve = async (p) => {
    setBusyId(p.id)
    setError('')
    const chosenRole = roleChoice[p.id] ?? 'member'
    const isFounderRole = chosenRole === 'excom' || chosenRole === 'admin'

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'active',
        role: chosenRole,
        team_id: isFounderRole ? null : p.team_id,
      })
      .eq('id', p.id)

    if (updateError) {
      setError(updateError.message)
      setBusyId(null)
      return
    }

    if (chosenRole === 'leader' && p.team_id) {
      const { error: leadError } = await supabase
        .from('team_leads')
        .insert({ profile_id: p.id, team_id: p.team_id, position: 'vice_head' })

      if (leadError) {
        setError(`Approved, but failed to link as team lead: ${leadError.message}`)
      }
    }

    setPending((prev) => prev.filter((row) => row.id !== p.id))
    setBusyId(null)
  }

  const reject = async (id) => {
    setBusyId(id)
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'inactive' })
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setPending((prev) => prev.filter((p) => p.id !== id))
    }
    setBusyId(null)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-16">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 glass-pill hover:bg-primary/10 transition-colors"
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
            Pending Approvals
          </h1>
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        {loading ? (
          <p className="text-foreground/40 text-sm">Loading…</p>
        ) : pending.length === 0 ? (
          <div className="glass p-8 text-center">
            <p className="text-foreground/40 text-sm">No pending signups right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="glass p-5 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{p.full_name}</p>
                  <p className="text-foreground/40 text-xs truncate">{p.email}</p>
                  <p className="text-foreground/40 text-xs mt-1 uppercase tracking-wide">
                    {p.teams?.name ?? 'No team'}
                  </p>
                </div>

                <select
                  value={roleChoice[p.id] ?? 'member'}
                  onChange={(e) => setRoleChoice((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  className="glass-pill px-3 py-2 bg-transparent outline-none focus:ring-1 focus:ring-primary text-xs shrink-0"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r} className="bg-background">
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => approve(p)}
                    disabled={busyId === p.id}
                    className="p-2.5 rounded-full bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors disabled:opacity-50"
                    aria-label="Approve"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => reject(p.id)}
                    disabled={busyId === p.id}
                    className="p-2.5 rounded-full bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50"
                    aria-label="Reject"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </FadeIn>
    </div>
  )
}
