// The app's date formatting, in one place (EventPage/Announcements/Profile
// each used to re-implement their own variant).
export const formatDateTime = (iso, { dateStyle = 'medium', timeStyle = 'short' } = {}) =>
  new Date(iso).toLocaleString(undefined, { dateStyle, timeStyle })

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })