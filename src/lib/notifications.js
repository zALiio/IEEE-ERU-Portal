import { supabase } from './supabaseClient'

// Delete every notification whose message references a removed entity's title.
// NOTE: entity titles are baked into notification message text, so this is a
// substring sweep — it also matches unrelated notifications that happen to
// contain the same words, and it silently stops matching if the message
// template changes. The durable fix is linking notifications to their entity
// by id in the schema; until then, keep the template stable and use this one
// helper so all callers match it identically.
export async function removeNotificationsMatching(title) {
  if (!title) return { error: null }
  return supabase.from('notifications').delete().ilike('message', `%${title}%`)
}