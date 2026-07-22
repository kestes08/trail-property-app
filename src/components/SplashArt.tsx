/** Stylized sunset scene for the launch screen: gradient sky, mountains, a
 *  lake, pines and a cabin — an original illustration in the app's spirit. */
export function SplashArt() {
  return (
    <svg
      className="splash__art"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#312e63" />
          <stop offset="0.24" stopColor="#5a3f78" />
          <stop offset="0.46" stopColor="#9a5486" />
          <stop offset="0.63" stopColor="#d07a72" />
          <stop offset="0.78" stopColor="#ec9a62" />
          <stop offset="0.9" stopColor="#f4c17e" />
          <stop offset="1" stopColor="#f7dc9c" />
        </linearGradient>
        <radialGradient id="sun" cx="0.42" cy="0.66" r="0.4">
          <stop offset="0" stopColor="#ffe6b8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe6b8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d7e0e6" />
          <stop offset="1" stopColor="#b3c3d4" />
        </linearGradient>
      </defs>

      {/* sky + sun glow */}
      <rect width="390" height="844" fill="url(#sky)" />
      <rect y="330" width="390" height="330" fill="url(#sun)" />

      {/* distant snowy range */}
      <path
        d="M0 590 L58 520 L104 562 L150 498 L206 556 L262 502 L322 560 L390 516 L390 640 L0 640 Z"
        fill="#8f8fbb"
      />
      <path d="M150 498 L128 528 L150 520 L172 532 Z" fill="#dcdcef" />
      <path d="M262 502 L242 532 L262 524 L284 536 Z" fill="#dcdcef" />
      {/* nearer ridge */}
      <path d="M0 618 L96 566 L188 606 L280 560 L390 606 L390 660 L0 660 Z" fill="#6f6f9f" />

      {/* ground */}
      <path d="M0 636 L390 622 L390 844 L0 844 Z" fill="#415a3c" />

      {/* lake */}
      <path
        d="M74 706 Q 152 680 236 706 Q 270 718 252 750 Q 168 790 94 778 Q 46 770 74 706 Z"
        fill="url(#lake)"
      />

      {/* path to the cabin */}
      <path
        d="M232 742 Q 300 726 316 672"
        fill="none"
        stroke="#dcc48c"
        strokeWidth="20"
        strokeLinecap="round"
      />

      {/* left pine (on the near bank) */}
      <g>
        <rect x="34" y="746" width="8" height="24" fill="#5a4327" />
        <path d="M38 682 L64 740 L12 740 Z" fill="#33502f" />
        <path d="M38 704 L68 752 L8 752 Z" fill="#3c5b36" />
      </g>

      {/* right pines */}
      <g>
        <rect x="316" y="700" width="9" height="26" fill="#5a4327" />
        <path d="M320 590 L360 672 L280 672 Z" fill="#2f4a2c" />
        <path d="M320 620 L356 700 L284 700 Z" fill="#375632" />
      </g>

      {/* cabin + dock */}
      <g>
        <rect x="238" y="700" width="52" height="40" fill="#6b4a33" />
        <path d="M232 702 L264 676 L296 702 Z" fill="#4a3120" />
        <rect x="256" y="712" width="16" height="18" fill="#f2c14e" />
        <rect x="196" y="742" width="44" height="7" rx="2" fill="#7a5636" />
      </g>

      {/* subtle darkening at the very top for text legibility */}
      <rect width="390" height="220" fill="#241f4a" opacity="0.28" />
    </svg>
  )
}
