import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabaseClient'
import { Megaphone, Pin, Plus, X, Sun, Moon, ArrowLeft, Pencil, Trash2 } from 'lucide-react'

export default function AnnouncementsPage() {
  const { profile } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const isManager = profile?.role === 'excom' || profile?.role === 'admin'

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
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
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resetForm = () => {
    setTitle(''); setBody(''); setPinned(false)
    setShowForm(false); setEditingId(null); setError('')
  }

  const startEdit = (a) => {
    setEditingId(a.id)
    setTitle(a.title)
    setBody(a.body)
    setPinned(a.pinned)
    setShowForm(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title || !body) { setError('Title and body required'); return }
    setSubmitting(true)

    const payload = { title, body, pinned }
    const { error } = editingId
      ? await supabase.from('portal_announcements').update(payload).eq('id', editingId)
      : await supabase.from('portal_announcements').insert({ ...payload, created_by: profile.id })

    setSubmitting(false)
    if (error) { setError(error.message); return }
    resetForm()
    await load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this announcement?')) return
    await supabase.from('portal_announcements').delete().eq('id', id)
    await load()
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

      <div className="max-w-2xl w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-foreground/50 hover:text-foreground/80 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Megaphone className="text-primary" size={28} />
            <h1 className="text-2xl font-black uppercase tracking-tight glow-text">Announcements</h1>
          </div>
          {isManager && (
            <button onClick={() => (showForm ? resetForm() : setShowForm(true))} className="glass-pill text-xs px-4 py-2 flex items-center gap-1.5 hover:bg-primary/10 transition-colors">
              {showForm ? <X size={12} /> : <Plus size={12} />}
              {showForm ? 'Cancel' : 'New'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={submit} className="glass p-5 mb-4 space-y-2">
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full glass-pill px-4 py-2 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm" />
            <textarea placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} required
              className="w-full glass-pill px-4 py-2 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm resize-none" />
            <label className="flex items-center gap-2 text-xs text-foreground/60">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
              Pin to top
            </label>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full text-sm disabled:opacity-50">
              {submitting ? 'Saving…' : editingId ? 'Update Announcement' : 'Post Announcement'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-foreground/40 text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-foreground/40 text-sm">No announcements yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((a) => (
              <div key={a.id} className="glass p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {a.pinned && <Pin size={12} className="text-primary shrink-0" />}
                    <p className="font-semibold text-sm truncate">{a.title}</p>
                  </div>
                  {isManager && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => startEdit(a)} className="text-foreground/40 hover:text-primary transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(a.id)} className="text-foreground/40 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
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
    </div>
  )
}
