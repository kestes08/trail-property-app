import { useStore, type TabKey } from '../store'

interface TabDef {
  key: TabKey
  label: string
  icon: (active: boolean) => JSX.Element
}

const stroke = (active: boolean) => (active ? '#c8743a' : '#8a988c')

const tabs: TabDef[] = [
  {
    key: 'home',
    label: 'Home',
    icon: (a) => (
      <path d="M3 9.5 11 3l8 6.5V19a1 1 0 0 1-1 1h-4v-6h-6v6H4a1 1 0 0 1-1-1V9.5Z" stroke={stroke(a)} strokeWidth="1.7" strokeLinejoin="round" fill="none" />
    ),
  },
  {
    key: 'map',
    label: 'Map',
    // Folded paper map.
    icon: (a) => (
      <path
        d="M3 6l6-2 4 2 6-2v14l-6 2-4-2-6 2V6Zm6-2v14m4-12v14"
        stroke={stroke(a)}
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    ),
  },
  {
    key: 'trails',
    label: 'Trails',
    // Winding dotted route with a start point and a destination marker.
    icon: (a) => (
      <>
        <path
          d="M5 20 C 12 18 3 13 10 11 C 16 9.5 11 6 16 4"
          stroke={stroke(a)}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeDasharray="0.4 3.4"
          fill="none"
        />
        <circle cx="5" cy="20" r="1.7" fill={stroke(a)} />
        <circle cx="16" cy="4" r="1.7" fill={stroke(a)} />
      </>
    ),
  },
  {
    key: 'yard',
    label: 'Yard',
    icon: (a) => (
      <path d="M11 20V9m0 0c0-3 2-5 5-5-.2 3-2 5-5 5Zm0 2c0-3-2-5-5-5 .2 3 2 5 5 5Z" stroke={stroke(a)} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" fill="none" />
    ),
  },
  {
    key: 'gear',
    label: 'Gear',
    // Wrench — reads as tools / maintenance.
    icon: (a) => (
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke={stroke(a)}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    ),
  },
  {
    key: 'stats',
    label: 'Stats',
    icon: (a) => (
      <path d="M4 19V5m4 14v-7m4 7V8m4 11v-4m4 4V6" stroke={stroke(a)} strokeWidth="1.7" strokeLinecap="round" fill="none" />
    ),
  },
]

export function TabBar() {
  const { route, setRoute } = useStore()
  return (
    <nav className="tabbar">
      {tabs.map((t) => {
        const active = route === t.key
        return (
          <button
            key={t.key}
            className={`tabbar__item ${active ? 'is-active' : ''}`}
            onClick={() => setRoute(t.key)}
            aria-current={active ? 'page' : undefined}
          >
            <svg width="22" height="24" viewBox="0 0 22 24" fill="none" aria-hidden>
              {t.icon(active)}
            </svg>
            <span>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
