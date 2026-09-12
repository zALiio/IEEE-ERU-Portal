// Lightweight SVG wave divider between sections (pattern from ieee-eru.org)
export default function Wave({ flip = false, className = '', height = 34 }) {
  return (
    <div
      className={`wave-divider ${flip ? 'wave-divider--flip' : ''} ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="ieee-wave-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,122,204,0)" />
            <stop offset="50%" stopColor="rgba(0,122,204,0.35)" />
            <stop offset="100%" stopColor="rgba(0,122,204,0)" />
          </linearGradient>
        </defs>
        <path
          d="M0,34 C140,58 260,4 420,30 C560,52 660,18 820,32 C960,44 1060,10 1240,30 C1320,40 1400,20 1440,26"
          fill="none"
          stroke="url(#ieee-wave-grad)"
          strokeWidth="1.5"
        />
        <path
          d="M0,44 C140,60 300,26 460,44 C620,60 760,32 940,46 C1100,58 1260,38 1440,46"
          fill="none"
          stroke="url(#ieee-wave-grad)"
          strokeWidth="1"
          opacity="0.5"
        />
        {flip && (
          <path
            d="M0,6 C180,-6 340,22 520,6 C700,-8 880,20 1080,8 C1240,0 1360,14 1440,8"
            fill="none"
            stroke="url(#ieee-wave-grad)"
            strokeWidth="1.5"
          />
        )}
      </svg>
    </div>
  )
}