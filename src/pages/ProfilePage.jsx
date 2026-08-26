import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Cropper from 'react-easy-crop'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabaseClient'
import getCroppedBlob from '../lib/cropImage'
import { Sun, Moon, ArrowLeft, User, Upload } from 'lucide-react'

export default function ProfilePage() {
  const { isDark, toggleTheme } = useTheme()
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Cropper modal state
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedPixels, setCroppedPixels] = useState(null)

  // Staged (not-yet-saved) avatar
  const [pendingBlob, setPendingBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageSrc(reader.result)
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedPixels(areaPixels)
  }, [])

  const confirmCrop = async () => {
    const blob = await getCroppedBlob(imageSrc, croppedPixels)
    setPendingBlob(blob)
    setPreviewUrl(URL.createObjectURL(blob))
    setImageSrc(null)
  }

  const dirty = pendingBlob || fullName.trim() !== (profile?.full_name ?? '')

  const saveAll = async () => {
    setError('')
    if (!fullName.trim()) { setError('Name is required'); return }
    setSaving(true)

    try {
      const updates = { full_name: fullName.trim() }

      if (pendingBlob) {
        const path = `${profile.id}/avatar.jpg`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, pendingBlob, { upsert: true, contentType: 'image/jpeg' })
        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        updates.avatar_url = `${data.publicUrl}?t=${Date.now()}`
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
      if (updateError) throw updateError

      await refreshProfile()
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
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
            {previewUrl || profile?.avatar_url ? (
              <img src={previewUrl ?? profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border border-foreground/10" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User size={32} className="text-primary" />
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 glass-pill p-2 cursor-pointer hover:bg-primary/10 transition-colors">
              <Upload size={14} />
              <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </label>
          </div>
        </div>

        <div className="glass p-6 space-y-3">
          <label className="text-xs uppercase tracking-wide text-foreground/50">Full Name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
            className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm" />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={saveAll} disabled={saving || !dirty} className="btn-primary w-full text-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {imageSrc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-sm h-80 glass">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <input type="range" min={1} max={3} step={0.1} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full max-w-sm mt-4" />
          <div className="flex gap-3 mt-4 w-full max-w-sm">
            <button onClick={() => setImageSrc(null)} className="glass-pill flex-1 py-2.5 text-sm hover:bg-primary/10 transition-colors">
              Cancel
            </button>
            <button onClick={confirmCrop} className="btn-primary flex-1 text-sm">
              Use Photo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
