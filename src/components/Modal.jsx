// Shared modal shell: full-screen backdrop + centered glass panel, clicking
// the backdrop closes. Content owns its own header/close button, so callers
// pass panels of whatever width/size they need.
export default function Modal({ children, onClose, overlayClassName = '', panelClassName = '' }) {
  return (
    <div
      className={`fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50 ${overlayClassName}`}
      onClick={onClose}
    >
      <div className={`glass p-6 ${panelClassName}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
