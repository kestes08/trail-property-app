import { PropertyMapLive } from '../components/PropertyMapLive'
import { dueLabel, isSoon } from '../format'
import { hasMapsKey, mapExternalUrl } from '../maps'
import { useStore } from '../store'
import type { Task } from '../types'

const moduleLabel: Record<Task['module'], string> = {
  trail: 'Trail Builder',
  yard: 'Yard',
  equipment: 'Equipment',
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Home() {
  const {
    property,
    segments,
    tasks,
    overallPercent,
    openTaskCount,
    equipment,
    boundaries,
    zones,
    showBoundary,
    showElevation,
    showZones,
    toggleBoundary,
    toggleElevation,
    toggleZones,
    toggleTask,
    setRoute,
  } = useStore()

  const upcoming = tasks.filter((t) => !t.done).slice(0, 4)
  const toolsLogged = equipment.length
  const trailCount = segments.filter((s) => s.status !== 'planned').length

  return (
    <div className="screen-pad home">
      {/* Header */}
      <header className="home__header">
        <div>
          <div className="label" style={{ color: 'var(--ink-softer)' }}>
            {greeting()}, {property.owner}
          </div>
          <h1 className="head home__title">{property.address}</h1>
          <div className="home__sub">{property.location}</div>
        </div>
      </header>

      {/* Map card — interactive Google Map with trail overlays */}
      <div className="map-card">
        <PropertyMapLive
          property={property}
          segments={segments}
          boundaries={showBoundary ? boundaries : []}
          zones={showZones ? zones : []}
          showElevation={showElevation}
        />
        <a
          className="map-card__open pill"
          href={mapExternalUrl(property)}
          target="_blank"
          rel="noreferrer"
        >
          Map ↗
        </a>
        <div className="map-card__stat pill">{trailCount} trails · 3 zones</div>
      </div>

      {/* Overlay toggles (only meaningful on the live JS map) */}
      {hasMapsKey() && (
        <div className="map-toggles">
          {boundaries.length > 0 && (
            <button
              className={`toggle-chip ${showBoundary ? 'is-on' : ''}`}
              aria-pressed={showBoundary}
              onClick={toggleBoundary}
            >
              <span className="toggle-chip__dot" style={{ background: '#3d5a3f' }} />
              Property lines
            </button>
          )}
          {zones.length > 0 && (
            <button
              className={`toggle-chip ${showZones ? 'is-on' : ''}`}
              aria-pressed={showZones}
              onClick={toggleZones}
            >
              <span className="toggle-chip__dot" style={{ background: '#8ec06a' }} />
              Zones
            </button>
          )}
          <button
            className={`toggle-chip ${showElevation ? 'is-on' : ''}`}
            aria-pressed={showElevation}
            onClick={toggleElevation}
          >
            <span className="toggle-chip__dot" style={{ background: '#9c6b3f' }} />
            Elevation
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="stat-row">
        <div className="stat-card" style={{ background: 'var(--forest)', color: 'var(--cream)' }}>
          <div className="num stat-card__big">{overallPercent}%</div>
          <div className="stat-card__cap">Trails built</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--olive)', color: '#fff' }}>
          <div className="num stat-card__big">{openTaskCount}</div>
          <div className="stat-card__cap">Open tasks</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--tan)', color: 'var(--ink)' }}>
          <div className="num stat-card__big">{toolsLogged}</div>
          <div className="stat-card__cap">Tools logged</div>
        </div>
      </div>

      {/* Upcoming */}
      <div className="section-head">
        <span className="label">Upcoming</span>
        <button className="link" onClick={() => setRoute('yard')}>
          See all
        </button>
      </div>
      {upcoming.length === 0 ? (
        <div className="mini-empty card">Nothing scheduled yet.</div>
      ) : (
        <div className="task-list">
          {upcoming.map((t) => (
            <div className="task-row card" key={t.id}>
              <button
                className={`checkbox ${t.done ? 'is-done' : ''}`}
                aria-label={t.done ? 'Mark not done' : 'Mark done'}
                onClick={() => toggleTask(t.id)}
              />
              <div className="task-row__body">
                <div className="task-row__title">{t.title}</div>
                <div className="task-row__sub">
                  {moduleLabel[t.module]}
                  {t.zone ? ` · ${t.zone}` : ''}
                </div>
              </div>
              <span className={`due-pill ${isSoon(t.dueDate) ? 'is-soon' : ''}`}>
                {dueLabel(t.dueDate)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
