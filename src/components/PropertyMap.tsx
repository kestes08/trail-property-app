/**
 * Stylized, illustrated property map (not satellite). Wooded zone, meadow,
 * pond, house, and two dashed trail lines with circular waypoint markers.
 */
export function PropertyMap({ height = 176 }: { height?: number }) {
  return (
    <svg
      viewBox="0 0 340 200"
      width="100%"
      height={height}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Illustrated map of Hollow Ridge: wooded ridge, meadow, pond and trails"
      style={{ display: 'block' }}
    >
      <defs>
        <clipPath id="mapclip">
          <rect x="0" y="0" width="340" height="200" rx="0" />
        </clipPath>
      </defs>
      <g clipPath="url(#mapclip)">
        {/* base meadow */}
        <rect x="0" y="0" width="340" height="200" fill="#e7e0c8" />
        {/* wooded zone (upper-left) */}
        <path d="M0 0h210c-20 40-30 70-70 92C90 116 40 120 0 108Z" fill="#c7d2ad" />
        <path d="M0 0h150c-14 28-26 48-58 64C58 78 28 84 0 78Z" fill="#b6c69a" />
        {/* meadow patch (lower-right) */}
        <path d="M340 200H120c22-28 46-40 92-46 40-5 92 0 128 10Z" fill="#dcd3ab" />
        {/* pond */}
        <ellipse cx="250" cy="60" rx="34" ry="22" fill="#9fc0c4" />
        <ellipse cx="250" cy="60" rx="34" ry="22" fill="none" stroke="#7ea6ab" strokeWidth="1.5" />

        {/* little tree marks over the wooded zone */}
        {[
          [26, 26],
          [60, 40],
          [40, 66],
          [92, 30],
          [80, 70],
          [120, 52],
          [20, 96],
          [110, 92],
        ].map(([x, y], i) => (
          <path
            key={i}
            d={`M${x} ${y + 8}v-6m0 0-4 3m4-3 4 3m-4-6-3 3m3-3 3 3`}
            stroke="#5d7a4e"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {/* house */}
        <g transform="translate(150 150)">
          <path d="M-13 4 0-8l13 12v14a2 2 0 0 1-2 2H-11a2 2 0 0 1-2-2Z" fill="#c8743a" />
          <path d="M-16 5 0-10l16 15" stroke="#8f4f27" strokeWidth="2.4" fill="none" strokeLinejoin="round" />
          <rect x="-4" y="12" width="8" height="12" fill="#f3efe4" />
        </g>

        {/* trail 1 — clay/accent, dashed, ridge to house */}
        <path
          d="M22 40C70 60 60 110 120 120s120-6 156 12"
          stroke="#c8743a"
          strokeWidth="3"
          strokeDasharray="2 8"
          strokeLinecap="round"
          fill="none"
        />
        {/* trail 2 — olive, dashed, meadow connector (planned) */}
        <path
          d="M170 168C210 150 250 150 300 130"
          stroke="#6f7a44"
          strokeWidth="2.5"
          strokeDasharray="2 7"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />

        {/* waypoint markers */}
        {[
          [22, 40],
          [120, 120],
          [278, 132],
          [300, 130],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="5.5" fill="#fff" />
            <circle cx={x} cy={y} r="5.5" fill="none" stroke="#c8743a" strokeWidth="2" />
          </g>
        ))}
      </g>
    </svg>
  )
}
