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
    key: 'trails',
    label: 'Trails',
    icon: (a) => (
      <path d="M5 20c0-4 4-4 4-8s-4-4-4-8m8 16c0-4 4-4 4-8" stroke={stroke(a)} strokeWidth="1.7" strokeLinecap="round" fill="none" />
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
    icon: (a) => (
      <path d="M11 14.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7-3.5-1.6-.5.6-1.6-1.4-1.4-1.6.6L12.5 6l-.5-1.6h-2L9.5 6l-1.6-.5-1.4 1.4.6 1.6L5 11l1.6.5-.6 1.6 1.4 1.4 1.6-.6.5 1.6h2l.5-1.6 1.6.6 1.4-1.4-.6-1.6L18 11Z" stroke={stroke(a)} strokeWidth="1.4" strokeLinejoin="round" fill="none" />
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
