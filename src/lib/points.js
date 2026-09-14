import { supabase } from './supabaseClient'

// Apply a signed point delta to a profile and record it in points_log.
//
// NOT atomic: the log insert and the balance update are two statements, so a
// client crash between them leaves a log row without a matching balance change
// (or vice versa). For race-free application use the server RPC
// `apply_points_delta` (supabase/migrations/20260913_apply_points_delta.sql);
// this client helper is the pragmatic single-session variant.
export async function applyPointsDelta({
  profileId,
  basePoints,
  points, // signed delta: positive = award, negative = deduction
  note,
  entryType = 'adjustment',
  taskId = null,
}) {
  const { error: logError } = await supabase.from('points_log').insert({
    task_id: taskId,
    profile_id: profileId,
    points,
    note,
    entry_type: entryType,
  })
  if (logError) return { error: logError }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ points: (basePoints ?? 0) + points })
    .eq('id', profileId)
  if (updateError) return { error: updateError }

  return { error: null }
}