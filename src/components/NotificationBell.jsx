import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function NotificationBell() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const load = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('id, message, link, is_read, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setItems(data ?? [])
  }

  useEffect(() => {
    if (profile?.id) load()
  }, [profile?.id])

  // Close the desktop dropdown when clicking outside.
  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Close the mobile panel when the Escape key is pressed.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const unreadCount = items.filter((n) => !n.is_read).length

  const openBell = () => {
    setOpen((prev) => !prev)
    if (!open) load()
  }

  const handleClick = async (n) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)))
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const renderList = () =>
    items.length === 0 ? (
      <p className="text-foreground/40 text-xs p-3 text-center">No notifications yet.</p>
    ) : (
      items.map((n) => (
        <button
          key={n.id}
          onClick={() => handleClick(n)}
          className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors hover:bg-primary/10 ${
            n.is_read ? 'text-foreground/50' : 'text-foreground font-medium'
          }`}
        >
          {n.message}
        </button>
      ))
    )

  return (
    <div className="relative" ref={ref}>
      {/* The bell button itself (shared on all screen sizes) */}
      <button
        onClick={openBell}
        className="relative glass-pill p-3 hover:bg-primary/10 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile: slide-in panel from the right, with a backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-overlay"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.aside
            key="notif-panel"
            className="fixed top-0 right-0 h-full w-[85%] max-w-sm glass z-50 sm:hidden flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
              <span className="text-sm font-bold uppercase tracking-wider">
                Notifications
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-2 glass-pill hover:bg-primary/10 transition-colors"
                aria-label="Close notifications"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">{renderList()}</div>
            {items.length > 0 && (
              <p className="text-foreground/30 text-[10px] uppercase tracking-wider text-center py-2">
                Swipe or press Escape to close
              </p>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop: dropdown below the bell */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-dropdown"
            className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto glass p-2 z-50 hidden sm:block"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
          >
            {renderList()}
          </motion.div>
        )}
      </AnimatePresence>

      </div>
  )
}