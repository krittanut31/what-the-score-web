const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export const ShuttleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden>
    <path d="M7 3h10l-2.4 10.5H9.4z" />
    <path d="M10.7 3l.4 10.5M13.3 3l-.4 10.5" />
    <circle cx="12" cy="17.5" r="3" />
  </svg>
)

export const BackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base} aria-hidden>
    <path d="M15 5l-7 7 7 7" />
  </svg>
)

export const SwapIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base} aria-hidden>
    <path d="M8 20V4M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4" />
  </svg>
)

export const UndoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base} aria-hidden>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 010 11H11" />
  </svg>
)

export const TrophyIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" {...base} aria-hidden>
    <path d="M7 4h10v5a5 5 0 01-10 0z" />
    <path d="M7 6H4.5a2.5 2.5 0 002.8 3.9M17 6h2.5a2.5 2.5 0 01-2.8 3.9M12 14v5M8 20h8" />
  </svg>
)
