// Infinite scrolling banner (pattern from ieee-eru.org). Content is duplicated
// twice and the track translates -50% for a seamless loop.
const PHRASES = [
  'Teamwork',
  'Innovation',
  'Excellence',
  'Leadership',
  'Engagement',
  'One Branch · One Family',
  'Engineering Tomorrow',
]

const FULL = [...PHRASES, ...PHRASES].join('  ✦  ')

export default function MembersMarquee({ className = '' }) {
  return (
    <div className={`members-marquee ${className}`} aria-hidden="true">
      <div className="marquee-track">
        <span>{FULL}</span>
        <span>{FULL}</span>
      </div>
    </div>
  )
}