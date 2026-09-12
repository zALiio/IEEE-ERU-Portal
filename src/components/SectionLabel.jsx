const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'

// Blue-dot + uppercase monospace section label (pattern from ieee-eru.org)
export default function SectionLabel({ children, small = false, className = '' }) {
  return (
    <div className={`section-label ${className}`}>
      <span className="section-label-dot" aria-hidden="true" />
      <span className={`section-label-text ${small ? 'text-xs' : 'text-sm'}`} style={{ fontFamily: MONO }}>
        {children}
      </span>
    </div>
  )
}