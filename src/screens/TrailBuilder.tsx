import { SuggestionCard } from '../components/SuggestionCard'
import { useStore } from '../store'
import type { TrailSegment } from '../types'

function pctColor(seg: TrailSegment): string {
  if (seg.aiFlagged) return 'var(--accent)'
  if (seg.percentComplete >= 70) return '#3f8560'
  if (seg.percentComplete < 40) return 'var(--ink-softer)'
  return 'var(--olive)'
}

export function TrailBuilder() {
  const {
    segments,
    weather,
    overallPercent,
    feetComplete,
    feetTotal,
    flaggedSegment,
    suggestionDismissed,
    dismissSuggestion,
    addTaskForSuggestion,
    setRoute,
  } = useStore()

  const active = segments.filter((s) => s.status !== 'planned')
  const planned = segments.filter((s) => s.status === 'planned')

  return (
    <div className="screen-pad">
      <header className="sub-header">
        <button className="back" aria-label="Back" onClick={() => setRoute('home')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M12 4 6 10l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <h1 className="head sub-header__title">Ridge Loop</h1>
          <div className="sub-header__meta">{active.length} segments · 1 planned</div>
        </div>
      </header>

      {/* Overall progress */}
      <div className="overall-card">
        <div className="overall-card__row">
          <div>
            <div className="label" style={{ color: 'rgba(243,239,228,0.7)' }}>
              Overall progress
            </div>
            <div className="num overall-card__pct">{overallPercent}%</div>
          </div>
          <div className="overall-card__feet">
            <span className="num" style={{ fontSize: 20 }}>
              {feetComplete.toLocaleString()}
            </span>
            <span> / {feetTotal.toLocaleString()} ft</span>
          </div>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${overallPercent}%` }} />
        </div>
      </div>

      {/* AI suggestion */}
      {flaggedSegment && !suggestionDismissed && (
        <SuggestionCard
          label="Trail Assistant"
          body={`${weather.condition}. ${flaggedSegment.name} is your lowest segment at ${flaggedSegment.percentComplete}%. Cut its drainage today so the tread holds before the ground softens.`}
          primaryLabel="Add task"
          secondaryLabel="Dismiss"
          onPrimary={addTaskForSuggestion}
          onSecondary={dismissSuggestion}
        />
      )}

      {/* Segments */}
      <div className="section-head">
        <span className="label">Segments</span>
      </div>
      <div className="seg-list">
        {active.map((seg) => (
          <div key={seg.id} className={`seg-card card ${seg.aiFlagged ? 'is-flagged' : ''}`}>
            <div className="seg-card__top">
              <div className="seg-card__name">
                {seg.name}
                {seg.aiFlagged && <span className="tag-suggested">Suggested</span>}
              </div>
              <div className="num" style={{ color: pctColor(seg), fontSize: 16 }}>
                {seg.percentComplete}%
              </div>
            </div>
            <div className="progress-track on-cream">
              <div
                className="progress-fill"
                style={{
                  width: `${seg.percentComplete}%`,
                  background: seg.aiFlagged
                    ? 'var(--accent)'
                    : seg.percentComplete >= 70
                      ? 'linear-gradient(90deg, #7fb088, #3f8560)'
                      : 'var(--olive)',
                }}
              />
            </div>
          </div>
        ))}

        {planned.map((seg) => (
          <div key={seg.id} className="seg-card seg-card--planned">
            <div className="seg-card__top">
              <div className="seg-card__name" style={{ color: 'var(--ink-soft)' }}>
                {seg.name}
              </div>
              <span className="tag-planned">Planned</span>
            </div>
            <div className="seg-card__planned-meta">{seg.feetTotal.toLocaleString()} ft · not started</div>
          </div>
        ))}
      </div>
    </div>
  )
}
