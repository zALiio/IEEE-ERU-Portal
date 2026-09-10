import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const SHOWN_KEY = 'eru_portal_shown_notifs'

function getShownIds() {
  try {
    return JSON.parse(localStorage.getItem(SHOWN_KEY) || '[]')
  } catch {
    return []
  }
}

function markShown(ids) {
  try {
    const prev = getShownIds()
    const merged = [...new Set([...prev, ...ids])].slice(-100) // keep last 100
    localStorage.setItem(SHOWN_KEY, JSON.stringify(merged))
  } catch { /* ignore */ }
}

export default function useBrowserNotifications(profileId) {
  const permissionRef = useRef(typeof Notification !== 'undefined' ? Notification.permission : 'denied')

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied'
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission === 'denied') return 'denied'
    const result = await Notification.requestPermission()
    permissionRef.current = result
    return result
  }, [])

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    // Auto-request permission on first load
    requestPermission()
  }, [requestPermission])

  // Show a native notification
  const showNotification = useCallback((notif) => {
    if (permissionRef.current !== 'granted') return
    try {
      const n = new Notification('IEEE ERU Portal', {
        body: notif.message,
        icon: '/favicon.ico',
        tag: notif.id, // prevents duplicates
        data: { link: notif.link },
      })
      n.onclick = () => {
        window.focus()
        if (notif.link) window.location.href = notif.link
      }
    } catch { /* mobile Safari may not support new Notification() */ }
  }, [])

  // Poll for new notifications
  useEffect(() => {
    if (!profileId) return

    let active = true

    const check = async () => {
      if (!active || document.hidden) return // only check when tab is visible

      const { data } = await supabase
        .from('notifications')
        .select('id, message, link, is_read')
        .eq('user_id', profileId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!data?.length || !active) return

      const shown = getShownIds()
      const newOnes = data.filter((n) => !shown.includes(n.id))

      if (newOnes.length) {
        newOnes.forEach(showNotification)
        markShown(newOnes.map((n) => n.id))
      }
    }

    // Check immediately
    check()

    // Poll every 15 seconds
    const interval = setInterval(check, 15_000)

    // Also check when tab becomes visible
    const onVisibility = () => { if (!document.hidden) check() }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      active = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [profileId, showNotification])

  return { requestPermission, permission: permissionRef.current }
}
