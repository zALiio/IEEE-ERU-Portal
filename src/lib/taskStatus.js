// The canonical task lifecycle and its presentation, in ONE place.
//
// A task moves todo → in_progress → submitted (awaiting review) → confirmed.
// Points are only awarded when a leader/excom confirms (see the confirm_task
// RPC). 'done' is NOT a lifecycle state — no flow in the app writes it.
import { PlayCircle, Send } from 'lucide-react'

// How a member advances their own task.
export const STATUS_FLOW = {
  todo: { next: 'in_progress', label: 'Start', icon: PlayCircle },
  in_progress: { next: 'submitted', label: 'Submit', icon: Send },
  submitted: null,
  confirmed: null,
}

// Status color mapping used across dashboards and team detail.
export const STATUS_STYLES = {
  todo: 'text-foreground/40',
  in_progress: 'text-amber-400',
  submitted: 'text-blue-400',
  confirmed: 'text-green-400',
}

export const STATUS_LABELS = {
  submitted: 'Awaiting confirmation',
  confirmed: 'Confirmed',
}

// The tasks board is presented as three columns. NOTE: 'done' is displayed next
// to todo/in_progress but is not part of the lifecycle — tasks under review sit
// in 'submitted' and only become 'confirmed'. Keeping the label at 'Done' while
// the data uses 'submitted'/'confirmed' is a known display/product decision.
export const BOARD_COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
]
