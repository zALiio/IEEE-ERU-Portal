import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Cropper from 'react-easy-crop'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import getCroppedBlob from '../lib/cropImage'
import { User, Upload, Mail, Calendar, Lock } from 'lucide-react'
import PageShell from '../components/PageShell'


export default function ProfilePage() {
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

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  const changePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return }
    setPwSaving(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    setPwSaving(false)
    if (error) { setPwError(error.message); return }
    setPwSuccess(true)
    setNewPassword('')
    setConfirmPassword('')
  }

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
    <>
      <PageShell width="max-w-md">

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

        <div className="glass p-6 mt-4 space-y-2.5 text-sm">
          <div className="flex items-center gap-2.5 text-foreground/60">
            <Mail size={14} className="text-primary shrink-0" />
            <span className="truncate">{profile?.email}</span>
          </div>
          <div className="flex items-center gap-2.5 text-foreground/60">
            <Calendar size={14} className="text-primary shrink-0" />
            <span>Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}</span>
          </div>
          <div className="flex items-center gap-2.5 text-foreground/60">
            <User size={14} className="text-primary shrink-0" />
            <span className="capitalize">{profile?.role} · {profile?.teams?.name ?? 'No team'}</span>
          </div>
        </div>

        <form onSubmit={changePassword} className="glass p-6 mt-4 space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-foreground/50">
            <Lock size={12} /> Change Password
          </div>
          <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm" />
          <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full glass-pill px-4 py-2.5 bg-transparent outline-none focus:ring-1 focus:ring-primary text-sm" />
          {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
          {pwSuccess && <p className="text-green-400 text-xs">Password updated.</p>}
          <button type="submit" disabled={pwSaving || !newPassword} className="btn-primary w-full text-sm disabled:opacity-50">
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </PageShell>

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
    </>
  )
}
