/** Ranger mark: crossed rake and pickaxe, recolored to the app palette. */
export function RangerLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      {/* rake handle (brown) */}
      <path d="M47 51 L25 22" stroke="#7a5230" strokeWidth="6.5" strokeLinecap="round" />
      {/* pick handle (accent) */}
      <path d="M18 50 L46 18" stroke="#c8743a" strokeWidth="6.5" strokeLinecap="round" />

      {/* rake head (olive): crossbar + tines */}
      <path d="M12 22 L31 13" stroke="#6f7a44" strokeWidth="5" strokeLinecap="round" />
      <g stroke="#6f7a44" strokeWidth="3.4" strokeLinecap="round">
        <path d="M14 21 L12 29" />
        <path d="M19 18.6 L17 26.6" />
        <path d="M24 16.2 L22 24.2" />
        <path d="M29 13.8 L27 21.8" />
      </g>

      {/* pick head (steel) */}
      <path d="M33 10 Q47 10 54 25" stroke="#9aa39b" strokeWidth="8" strokeLinecap="round" />
    </svg>
  )
}
