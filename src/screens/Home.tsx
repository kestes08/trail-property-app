import { PropertyMapEmbed } from '../components/PropertyMapEmbed'
import { dueLabel, isSoon } from '../format'
import { mapExternalUrl } from '../maps'
import { useStore } from '../store'
import type { Task } from '../types'

const moduleLabel: Record<Task['module'], string> = {
  trail: 'Trail Builder',
  yard: 'Yard',
  equipment: 'Equipment',
}

export function Home() {
  const {
    property,
    weather,
    segments,
    tasks,
    overallPercent,
    openTaskCount,
    equipment,
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
            Good morning, {property.owner}
          </div>
          <h1 className="head home__title">{property.name}</h1>
          <div className="home__sub">
            {property.location} · {property.acreage} acres
          </div>
        </div>
        <div className="weather-chip">
          <span className="livedot" style={{ animation: 'none' }} />
          <div>
            <div className="num" style={{ fontSize: 18 }}>
              {weather.tempF}°
            </div>
            <div className="weather-chip__cond">{weather.condition}</div>
          </div>
        </div>
      </header>

      {/* Map card — interactive embedded Google Map */}
      <div className="map-card">
        <PropertyMapEmbed property={property} />
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
    </div>
  )
}
