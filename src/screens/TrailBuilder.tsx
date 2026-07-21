import { useState } from 'react'
import { PropertyMapLive } from '../components/PropertyMapLive'
import { SuggestionCard } from '../components/SuggestionCard'
import { pathLengthFeet } from '../geo'
import { hasMapsKey } from '../maps'
import { fetchParcelAt } from '../parcel'
import { useStore } from '../store'
import { useTrailTracker } from '../useTrailTracker'
import type { LatLng, TrailSegment } from '../types'

type DrawMode = null | 'trail' | 'boundary' | 'gps'

function pctColor(seg: TrailSegment): string {
  if (seg.aiFlagged) return 'var(--accent)'
  if (seg.percentComplete >= 70) return '#3f8560'
  if (seg.percentComplete < 40) return 'var(--ink-softer)'
  return 'var(--olive)'
}

export function TrailBuilder() {
  const {
    property,
    segments,
    weather,
    overallPercent,
    feetComplete,
    feetTotal,
    flaggedSegment,
    suggestionDismissed,
    dismissSuggestion,
    addTaskForSuggestion,
    addSegment,
    boundary,
    setBoundary,
    showElevation,
    setRoute,
  } = useStore()

  const [mode, setMode] = useState<DrawMode>(null)
  const [draftPath, setDraftPath] = useState<LatLng[]>([])
  const [name, setName] = useState('')
  const [gisLoading, setGisLoading] = useState(false)
  const [gisError, setGisError] = useState<string | null>(null)
  const tracker = useTrailTracker()

  const active = segments.filter((s) => s.status !== 'planned')
  const planned = segments.filter((s) => s.status === 'planned')

  // The path in progress: GPS points while recording, otherwise tapped points.
  const activePath = mode === 'gps' ? tracker.points : draftPath
  const draftFeet = pathLengthFeet(activePath)

  function start(m: 'trail' | 'boundary') {
    setDraftPath([])
    setName('')
    setMode(m)
  }

  function startGps() {
    setName('')
    tracker.reset()
    tracker.start()
    setMode('gps')
  }

  function exitDraw() {
    tracker.reset()
    setMode(null)
    setDraftPath([])
    setName('')
  }

  function save() {
    if (mode === 'trail' || mode === 'gps') {
      if (activePath.length < 2 || !name.trim()) return
      addSegment(name, activePath, draftFeet)
    } else if (mode === 'boundary') {
      if (activePath.length < 3) return
      setBoundary(activePath)
    }
    exitDraw()
  }

  async function importParcel() {
    setGisError(null)
    setGisLoading(true)
    try {
      const result = await fetchParcelAt(property.lat, property.lng)
      if (result?.boundary?.length) {
        setBoundary(result.boundary)
      } else {
        setGisError('No parcel found at your property center. Check the map is centered on your land, or trace it.')
      }
    } catch {
      setGisError("Couldn't reach the Virginia parcel service from your browser. You can trace your lines instead.")
    } finally {
      setGisLoading(false)
    }
  }

  const saveDisabled =
    mode === 'boundary' ? activePath.length < 3 : activePath.length < 2 || !name.trim()

  return (
    <div className="screen-pad">
      <header className="sub-header">
        <button className="back" aria-label="Back" onClick={() => setRoute('home')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M12 4 6 10l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <h1 className="head sub-header__title">Trails</h1>
          <div className="sub-header__meta">
            {segments.length === 0
              ? 'None plotted yet'
              : `${active.length} segment${active.length === 1 ? '' : 's'}${planned.length ? ` · ${planned.length} planned` : ''}`}
          </div>
        </div>
      </header>

      {mode ? (
        <div className="draw">
          <PropertyMapLive
            property={property}
            segments={segments}
            boundary={boundary}
            showElevation={showElevation}
            height={300}
            draftPath={activePath}
            trackMode={mode === 'gps'}
            recenter={mode === 'gps' && activePath.length ? activePath[activePath.length - 1] : undefined}
            onAddPoint={mode === 'gps' ? undefined : (pt) => setDraftPath((p) => [...p, pt])}
          />
          <div className="draw__panel">
            {mode === 'gps' && (
              <div className={`gps-status ${tracker.recording ? 'is-live' : ''}`}>
                <span className="gps-status__dot" />
                {tracker.recording ? 'Recording — walk the trail' : 'Paused'}
                {tracker.accuracy != null && (
                  <span className="gps-status__acc">±{Math.round(tracker.accuracy)} m</span>
                )}
              </div>
            )}
            <p className="draw__hint">
              {mode === 'trail'
                ? 'Tap along the route on the map to drop points. Each tap extends the trail line.'
                : mode === 'boundary'
                  ? 'Tap each corner of your property, walking the boundary in order. Tap Save to close the shape.'
                  : 'Walk the trail with your phone. Points record automatically. Pause anytime, then name it and save.'}
            </p>
            <div className="draw__stats">
              <span>
                <strong className="num">{activePath.length}</strong> point{activePath.length === 1 ? '' : 's'}
              </span>
              <span>
                <strong className="num">{draftFeet.toLocaleString()}</strong> ft{mode === 'boundary' ? ' perimeter' : ''}
              </span>
            </div>
            {tracker.error && mode === 'gps' && <p className="parcel-card__error">{tracker.error}</p>}
            {mode !== 'boundary' && (
              <input
                className="draw__input"
                value={name}
                placeholder="Trail name (e.g. Ridge Loop)"
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <div className="draw__actions">
              {mode === 'gps' ? (
                <button
                  className="btn btn--ghost"
                  onClick={() => (tracker.recording ? tracker.pause() : tracker.start())}
                >
                  {tracker.recording ? 'Pause' : 'Resume'}
                </button>
              ) : (
                <button className="btn btn--ghost" onClick={() => setDraftPath((p) => p.slice(0, -1))} disabled={draftPath.length === 0}>
                  Undo point
                </button>
              )}
              <button className="btn btn--ghost" onClick={exitDraw}>
                Cancel
              </button>
              <button className="btn btn--filled" onClick={save} disabled={saveDisabled}>
                {mode === 'boundary' ? 'Save boundary' : 'Save trail'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Property boundary */}
          <div className="parcel-card">
            <div className="parcel-card__head">
              <span className="label">Property lines</span>
              {boundary && <span className="parcel-card__badge">{boundary.length} corners</span>}
            </div>
            {boundary ? (
              <p className="parcel-card__body">Your boundary is drawn on the property map.</p>
            ) : (
              <p className="parcel-card__body">
                Show your property lines: pull them from Virginia's parcel GIS, or trace them on the map.
              </p>
            )}
            {hasMapsKey() ? (
              <div className="parcel-card__actions">
                {boundary ? (
                  <>
                    <button className="btn btn--ghost" onClick={() => start('boundary')}>
                      Re-trace
                    </button>
                    <button className="btn btn--ghost" onClick={() => setBoundary(null)}>
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn--filled" onClick={importParcel} disabled={gisLoading}>
                      {gisLoading ? 'Looking up…' : 'Import from VA GIS'}
                    </button>
                    <button className="btn btn--ghost" onClick={() => start('boundary')}>
                      Trace it
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="parcel-card__note">Property lines show once the site is deployed with your Google Maps key.</p>
            )}
            {gisError && <p className="parcel-card__error">{gisError}</p>}
          </div>

          {segments.length === 0 ? (
            <div className="empty">
              <div className="empty__icon" aria-hidden>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <path d="M6 20c0-4 4-4 4-8s-4-4-4-8m8 16c0-4 4-4 4-8" stroke="var(--olive)" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="head empty__title">No trails yet</h2>
              <p className="empty__body">
                Plot a trail by tracing its route on the map. Once it's saved you can log build progress on it from the
                assistant, and it'll show on your property map.
              </p>
              {hasMapsKey() ? (
                <div className="empty__actions">
                  <button className="btn btn--filled" onClick={startGps}>
                    Record by walking
                  </button>
                  <button className="btn btn--ghost" onClick={() => start('trail')}>
                    Plot by tapping
                  </button>
                </div>
              ) : (
                <p className="empty__note">
                  Plotting on the map needs your Google Maps key. Once the site is deployed with{' '}
                  <code>VITE_GOOGLE_MAPS_API_KEY</code> set, these appear here.
                </p>
              )}
            </div>
          ) : (
            <>
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

              <div className="section-head">
                <span className="label">Segments</span>
                {hasMapsKey() && (
                  <div className="section-head__actions">
                    <button className="link" onClick={startGps}>
                      + Record
                    </button>
                    <button className="link" onClick={() => start('trail')}>
                      + Tap
                    </button>
                  </div>
                )}
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
            </>
          )}
        </>
      )}
    </div>
  )
}
