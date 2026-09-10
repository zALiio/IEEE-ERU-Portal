import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabaseClient'
import { Sun, Moon, ArrowLeft, Calendar, MapPin, Video, Plus, X, Check, UserX, Pencil, Trash2 } from 'lucide-react'

const fmtDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function EventsPage() {
  const { isDark, toggleTheme } = useTheme()
  const { profile } = useAuth()
  const isManager = profile?.role === 'excom' || profile?.role === 'admin'

  const [events, setEvents] = useState([])
  const [myRsvps, setMyRsvps] = useState({}) // event_id -> rsvp row
  const [rsvpsByEvent, setRsvpsByEvent] = useState({}) // event_id -> [rsvp rows with profile]
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationType, setLocationType] = useState('in_person')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [points, setPoints] = useState(10)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data: eventRows } = await supabase
      .from('portal_events')
      .select('*')
      .order('event_date', { ascending: true })
    setEvents(eventRows ?? [])

    const { data: myRows } = await supabase
      .from('portal_event_rsvps')
      .select('*')
      .eq('profile_id', profile.id)
    const mine = {}
    for (const r of myRows ?? []) mine[r.event_id] = r
    setMyRsvps(mine)

    if (isManager) {
      const { data: allRsvps } = await supabase
        .from('portal_event_rsvps')
        .select('id, event_id, status, profile_id, profiles(full_name)')
      const grouped = {}
      for (const r of allRsvps ?? []) {
        if (!grouped[r.event_id]) grouped[r.event_id] = []
        grouped[r.event_id].push(r)
      }
      setRsvpsByEvent(grouped)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.id) load()
  }, [profile?.id])

  const rsvp = async (eventId) => {
    setError('')
    const { error } = await supabase.from('portal_event_rsvps').insert({ event_id: eventId, profile_id: profile.id })
    if (error) { setError(error.message); return }
    await load()
  }

  const cancelRsvp = async (rsvpId) => {
    setError('')
    const { error } = await supabase.from('portal_event_rsvps').delete().eq('id', rsvpId)
    if (error) { setError(error.message); return }
    await load()
  }

  const markAttendance = async (rsvpId, status) => {
    setError('')
    const { error } = await supabase.rpc('mark_attendance', { p_rsvp_id: rsvpId, p_status: status })
    if (error) { setError(error.message); return }
    await load()
  }

  const resetForm = () => {
    setTitle(''); setDescription(''); setLocation(''); setEventDate(''); setPoints(10)
    setLocationType('in_person'); setShowForm(false); setEditingId(null); setError('')
  }

  const startEdit = (ev) => {
    setEditingId(ev.id)
    setTitle(ev.title)
    setDescription(ev.description || '')
    setLocationType(ev.location_type || 'in_person')
    setLocation(ev.location || '')
    // Format ISO datetime-local value
    setEventDate(ev.event_date ? ev.event_date.slice(0, 16) : '')
    setPoints(ev.points ?? 10)
    setShowForm(true)
  }

  const removeEvent = async (id) => {
    if (!confirm('Delete this event?')) return
    const { data: target } = await supabase
      .from('portal_events')
      .select('id, title')
      .eq('id', id)
      .single()
    const { error: err } = await supabase.from('portal_events').delete().eq('id', id)
    if (err) { setError(err.message); return }
    if (target) {
      const { error: notifErr } = await supabase
        .from('notifications')
        .delete()
        .ilike('message', `%${target.title}%`)
      if (notifErr) console.warn('Failed to clean up event notifications:', notifErr.message)
    }
    await load()
  }

  const createEvent = async (e) => {
    e.preventDefault()
    setError('')
    if (!title || !eventDate) { setError('Title and date are required'); return }
    setSubmitting(true)

    const payload = {
      title,
      description: description || null,
      location_type: locationType,
      location: location || null,
      event_date: new Date(eventDate).toISOString(),
      points: Number(points),
    }

    const { error } = editingId
      ? await supabase.from('portal_events').update(payload).eq('id', editingId)
      : await supabase.from('portal_events').insert({ ...payload, created_by: profile.id })

    setSubmitting(false)
    if (error) { setError(error.message); return }
    resetForm()
    await load()
  }

  const now = new Date()
  const upcoming = events.filter((e) => new Date(e.event_date) >= now)
  const past = events.filter((e) => new Date(e.event_date) < now)

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-16">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 glass-pill hover:bg-primary/10 transition-colors"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="max-w-2xl w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-foreground/50 hover:text-foreground/80 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="text-primary" size={28} />
            <h1 className="text-2xl font-black uppercase tracking-tight glow-text">Events</h1>
          </div>
          {isManager && (
            <button onClick={() => setShowForm((p) => !p)} className="btn-primary text-xs px-4 py-2 flex items-center gap-2 w-fit">
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? 'Cancel' : 'Create Event'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={createEvent} className="glass p-6 mb-6 space-y-3">
            <input type="text" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm" />
            <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm resize-none" />
            <div className="flex gap-3">
              <select value={locationType} onChange={(e) => setLocationType(e.target.value)}
                className="w-1/2 glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm">
                <option value="in_person" className="bg-background">In Person</option>
                <option value="online" className="bg-background">Online</option>
              </select>
              <input type="text" placeholder={locationType === 'online' ? 'Meeting link' : 'Address / room'} value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-1/2 glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm" />
            </div>
            <div className="flex gap-3">
              <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required
                className="w-1/2 glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm" />
              <input type="number" min={0} placeholder="Points" value={points} onChange={(e) => setPoints(e.target.value)}
                className="w-1/2 glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm" />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full text-sm disabled:opacity-50">
              {submitting ? (editingId ? 'Updating…' : 'Creating…') : (editingId ? 'Update Event' : 'Create Event')}
            </button>
          </form>
        )}

        {error && !showForm && <p className="text-red-400 text-xs mb-4">{error}</p>}

        {loading ? (
          <p className="text-foreground/40 text-sm">Loading…</p>
        ) : (
          <>
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/50 mb-3">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-foreground/40 text-sm mb-8">No upcoming events.</p>
            ) : (
              <div className="space-y-3 mb-8">
                {upcoming.map((ev) => {
                  const mine = myRsvps[ev.id]
                  const rsvps = rsvpsByEvent[ev.id] ?? []
                  return (
                    <div key={ev.id} className="glass p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                        <p className="font-semibold truncate">{ev.title}</p>
                        {isManager && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => startEdit(ev)} className="text-foreground/40 hover:text-primary transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => removeEvent(ev.id)} className="text-foreground/40 hover:text-red-400 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                          <p className="text-foreground/40 text-xs mt-1">{fmtDate(ev.event_date)} · {ev.points} pts</p>
                          <div className="flex items-center gap-1.5 text-xs text-foreground/50 mt-1">
                            {ev.location_type === 'online' ? <Video size={12} /> : <MapPin size={12} />}
                            {ev.location_type === 'online' && ev.location ? (
                              <a href={ev.location} target="_blank" rel="noreferrer" className="text-blue-400 underline">Join Meeting</a>
                            ) : (
                              <span>{ev.location || (ev.location_type === 'online' ? 'Online' : 'In person')}</span>
                            )}
                          </div>
                          {ev.description && <p className="text-foreground/60 text-xs mt-2">{ev.description}</p>}
                        </div>
                        <div className="shrink-0">
                          {mine ? (
                            mine.status === 'going' ? (
                              <button onClick={() => cancelRsvp(mine.id)} className="glass-pill text-xs px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors">
                                Cancel RSVP
                              </button>
                            ) : (
                              <span className="glass-pill text-xs px-3 py-2 text-foreground/50">
                                {mine.status === 'attended' ? 'Attended' : 'No-show'}
                              </span>
                            )
                          ) : (
                            <button onClick={() => rsvp(ev.id)} className="btn-primary text-xs px-3 py-2">I'm Going</button>
                          )}
                        </div>
                      </div>

                      {isManager && (
                        <div className="mt-3 pt-3 border-t border-foreground/10">
                          <button onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)} className="text-xs text-foreground/50 underline">
                            {expandedId === ev.id ? 'Hide' : 'Manage'} attendance ({rsvps.length})
                          </button>
                          {expandedId === ev.id && (
                            <div className="mt-3 space-y-2">
                              {rsvps.length === 0 && <p className="text-foreground/40 text-xs">No RSVPs yet.</p>}
                              {rsvps.map((r) => (
                                <div key={r.id} className="flex items-center justify-between gap-3 text-xs">
                                  <span className="truncate">{r.profiles?.full_name}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-foreground/40 uppercase">{r.status}</span>
                                    <button onClick={() => markAttendance(r.id, 'attended')} className="glass-pill px-2 py-1 text-green-400 hover:bg-green-500/10 transition-colors" aria-label="Mark attended">
                                      <Check size={12} />
                                    </button>
                                    <button onClick={() => markAttendance(r.id, 'no_show')} className="glass-pill px-2 py-1 text-red-400 hover:bg-red-500/10 transition-colors" aria-label="Mark no-show">
                                      <UserX size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {past.length > 0 && (
              <>
                <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/50 mb-3">Past</h2>
                <div className="space-y-3">
                  {past.map((ev) => {
                    const mine = myRsvps[ev.id]
                    return (
                      <div key={ev.id} className="glass p-5 opacity-60 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{ev.title}</p>
                          <p className="text-foreground/40 text-xs mt-1">{fmtDate(ev.event_date)}</p>
                        </div>
                        {mine && <span className="text-xs text-foreground/50 shrink-0 uppercase">{mine.status}</span>}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
