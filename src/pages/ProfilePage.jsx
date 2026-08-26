import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabaseClient'
import { Sun, Moon, ArrowLeft, User, Upload } from 'lucide-react'

export default function ProfilePage() {
  const { isDark, toggleTheme } = useTheme()
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) { setError(uploadError.message); setUploading(false); return }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', profile.id)

    setUploading(false)
    if (updateError) { setError(updateError.message); return }
    await refreshProfile()
  }

  const saveName = async (e) => {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) { setError('Name is required'); return }
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', profile.id)

    setSaving(false)
    if (error) { setError(error.message); return }
    await refreshProfile()
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

      <div className="max-w-md w-full">
        <Link to="/" className="inline-flex items-center gap-2 text-foreground/50 hover:text-foreground/80 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <User className="text-primary" size={28} />
          <h1 className="text-2xl font-black uppercase tracking-tight glow-text">Profile</h1>
        </div>

        <div className="glass p-6 mb-4 flex flex-col items-center">
          <div className="relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border border-foreground/10" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={32} className="text-primary" />
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 glass-pill p-2 cursor-pointer hover:bg-primary/10 transition-colors">
              <Upload size={14} />
              <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" disabled={uploading} />
            </label>
          </div>
          {uploading && <p className="text-foreground/40 text-xs mt-3">Uploading…</p>}
        </div>

        <form onSubmit={saveName} className="glass p-6 space-y-3">
          <label className="text-xs uppercase tracking-wide text-foreground/50">Full Name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
            className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm" />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full text-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}
