import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Megaphone, Pin, Plus, X } from 'lucide-react'

export default function AnnouncementsFeed() {
  const { profile } = useAuth()
  const isManager = profile?.role === 'excom' || profile?.role === 'admin'

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('portal_announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10)
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    setError('')
    if (!title || !body) { setError('Title and body required'); return }
    setSubmitting(true)

    const { error } = await supabase.from('portal_announcements').insert({
      title, body, pinned, created_by: profile.id,
    })

    setSubmitting(false)
    if (error) { setError(error.message); return }

    setTitle(''); setBody(''); setPinned(false); setShowForm(false)
    await load()
  }

  if (loading) return null

  return (
    <div className="w-full max-w-2xl mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="text-primary" size={18} />
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/70">Announcements</h2>
        </div>
        {isManager && (
          <button onClick={() => setShowForm((p) => !p)} className="glass-pill text-xs px-3 py-1.5 flex items-center gap-1.5 hover:bg-primary/10 transition-colors">
            {showForm ? <X size={12} /> : <Plus size={12} />}
            {showForm ? 'Cancel' : 'New'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={create} className="glass p-4 mb-3 space-y-2">
          <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full glass-pill px-4 py-2 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm" />
          <textarea placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} required
            className="w-full glass-pill px-4 py-2 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm resize-none" />
          <label className="flex items-center gap-2 text-xs text-foreground/60">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Pin to top
          </label>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary w-full text-sm disabled:opacity-50">
            {submitting ? 'Posting…' : 'Post Announcement'}
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-foreground/40 text-sm">No announcements yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <div key={a.id} className="glass p-4">
              <div className="flex items-center gap-2">
                {a.pinned && <Pin size={12} className="text-primary shrink-0" />}
                <p className="font-semibold text-sm truncate">{a.title}</p>
              </div>
              <p className="text-foreground/60 text-xs mt-1.5 whitespace-pre-wrap">{a.body}</p>
              <p className="text-foreground/30 text-[10px] mt-2">
                {new Date(a.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
