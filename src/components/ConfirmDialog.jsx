// Generic confirm dialog (cancel + one destructive/primary action). Shared by
// TasksPage's delete flow and MemberDirectoryPage's warnings/termination.
import Modal from './Modal'

export default function ConfirmDialog({
  title,
  body,
  icon = null,
  confirmLabel = 'Confirm',
  confirmClassName = 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
  busyLabel = 'Working…',
  busy = false,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal onClose={onCancel} overlayClassName="bg-black/70 z-[60]" panelClassName="max-w-sm w-full">
      {icon ? (
        <div className="flex items-center gap-3 mb-3">
          {icon}
          <h3 className="font-bold text-lg">{title}</h3>
        </div>
      ) : (
        <h3 className="font-bold text-lg mb-2">{title}</h3>
      )}
      <p className="text-foreground/60 text-sm mb-6">{body}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 glass-pill py-2.5 text-sm hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${confirmClassName}`}
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
