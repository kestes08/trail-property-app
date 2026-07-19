export function StatusBar({ dark = false }: { dark?: boolean }) {
  const color = dark ? '#f3efe4' : '#1a2620'
  return (
    <div className="statusbar" style={{ color }}>
      <span>9:41</span>
      <div className="dots">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={i * 4.5}
              y={8 - i * 2.4}
              width="3"
              height={4 + i * 2.4}
              rx="1"
              fill={color}
            />
          ))}
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden>
          <path
            d="M8 10.5 1 4.3a10 10 0 0 1 14 0L8 10.5Z"
            stroke={color}
            strokeWidth="1.3"
            fill="none"
            opacity="0.9"
          />
          <circle cx="8" cy="9.4" r="1.3" fill={color} />
        </svg>
        <span className="bar" />
      </div>
    </div>
  )
}
