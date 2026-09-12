import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Megaphone, ChevronRight } from 'lucide-react'

export default function AnnouncementsFeed() {
  const [latest, setLatest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('portal_announcements')
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
      setLatest(data?.[0] ?? null)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return null

  return (
    <Link to="/announcements" className="w-full mb-6 block glass p-4 hover:bg-primary/5 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Megaphone className="text-primary shrink-0" size={16} />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-foreground/50">Announcements</p>
            <p className="text-sm font-semibold truncate">
              {latest ? latest.title : 'No announcements yet'}
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-foreground/30 shrink-0" />
      </div>
    </Link>
  )
}
