import { useState } from 'react'
import { PropertyMapLive } from '../components/PropertyMapLive'
import { SuggestionCard } from '../components/SuggestionCard'
import { propertyBoundary } from '../data'
import { closeAlongBoundary, pathLengthFeet } from '../geo'
import { hasMapsKey } from '../maps'
import { fetchParcelAt } from '../parcel'
import { useStore } from '../store'
import { useTrailTracker } from '../useTrailTracker'
import type { LatLng, TrailSegment, ZoneType } from '../types'

type DrawMode = null | 'trail' | 'boundary' | 'gps' | 'import' | 'zone' | 'zone-gps' | 'place'

const ZONE_LABELS: Record<ZoneType, string> = { lawn: 'Lawn', field: 'Field', woods: 'Woods' }

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
    boundaries,
    addBoundary,
    zones,
    addZone,
    clearZones,
    places,
    addPlace,
    removePlace,
    showElevation,
    setRoute,
  } = useStore()

  const [mode, setMode] = useState<DrawMode>(null)
  const [draftPath, setDraftPath] = useState<LatLng[]>([])
  const [name, setName] = useState('')
  const [gisLoading, setGisLoading] = useState(false)
  const [gisError, setGisError] = useState<string | null>(null)
  const [zoneType, setZoneType] = useState<ZoneType>('lawn')
  const [closeToBoundary, setCloseToBoundary] = useState(true)
  const [placeName, setPlaceName] = useState('')
  const tracker = useTrailTracker()

  const active = segments.filter((s) => s.status !== 'planned')
  const planned = segments.filter((s) => s.status === 'planned')

  const isGps = mode === 'gps' || mode === 'zone-gps'
  const isZone = mode === 'zone' || mode === 'zone-gps'

  // The path in progress: GPS points while recording, otherwise tapped points.
  const activePath = isGps ? tracker.points : draftPath
  const draftFeet = pathLengthFeet(activePath)

  // For a zone that closes along the property line, resolve the finished
  // polygon so it can be previewed while walking and used on save.
  const zonePolygon =
    isZone && closeToBoundary && activePath.length >= 2
      ? closeAlongBoundary(activePath, propertyBoundary)
      : activePath

  function start(m: 'trail' | 'boundary' | 'import') {
    setDraftPath([])
    setName('')
    setGisError(null)
    setMode(m)
  }

  // Walk a zone's edge with GPS; the property line closes the rest.
  function startZoneWalk(type: ZoneType) {
    setDraftPath([])
    setZoneType(type)
    tracker.reset()
    tracker.start()
    setMode('zone-gps')
  }

  // Tap a zone's outline on the map instead of walking it.
  function startZoneTap(type: ZoneType) {
    tracker.reset()
    setDraftPath([])
    setZoneType(type)
    setMode('zone')
  }

  // Switch the current zone draft between walking and tapping, keeping type.
  function switchZoneInput(to: 'zone' | 'zone-gps') {
    if (to === mode) return
    if (to === 'zone-gps') startZoneWalk(zoneType)
    else startZoneTap(zoneType)
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
      addBoundary(activePath)
    } else if (isZone) {
      if (zonePolygon.length < 3) return
      addZone(zoneType, zonePolygon)
    }
    exitDraw()
  }

  // Tap inside a parcel to pull its boundary from the GIS service.
  async function importAt(pt: LatLng) {
    if (gisLoading) return
    setGisError(null)
    setGisLoading(true)
    try {
      const result = await fetchParcelAt(pt.lat, pt.lng)
      if (result?.boundary?.length) {
        addBoundary(result.boundary)
      } else {
        setGisError('No parcel found there — tap right inside a parcel, or trace it instead.')
      }
    } catch {
      setGisError("Couldn't reach the parcel service. Try again, or trace the boundary instead.")
    } finally {
      setGisLoading(false)
    }
  }

  const saveDisabled = isZone
    ? zonePolygon.length < 3
    : mode === 'boundary'
      ? activePath.length < 3
      : activePath.length < 2 || !name.trim()

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

      {mode === 'place' ? (
        <div className="draw">
          <PropertyMapLive
            property={property}
            segments={segments}
            boundaries={[propertyBoundary, ...boundaries]}
            zones={zones}
            places={places}
            showElevation={showElevation}
            height={300}
            autoFit={false}
            onAddPoint={(pt) => {
              if (placeName.trim()) {
                addPlace(placeName, pt)
                setPlaceName('')
              }
            }}
          />
          <div className="draw__panel">
            <p className="draw__hint">
              Type a name, then tap where it is on the map. Add as many as you like — your house, nana's house, a gate.
            </p>
            <input
              className="draw__input"
              value={placeName}
              placeholder="Place name (e.g. My house)"
              onChange={(e) => setPlaceName(e.target.value)}
            />
            <div className="draw__stats">
              <span>
                <strong className="num">{places.length}</strong> place{places.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="draw__actions">
              <button className="btn btn--filled" onClick={exitDraw}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : mode === 'import' ? (
        <div className="draw">
          <PropertyMapLive
            property={property}
            segments={segments}
            boundaries={[propertyBoundary, ...boundaries]}
            zones={zones}
            places={places}
            showElevation={showElevation}
            height={300}
            autoFit={false}
            onAddPoint={importAt}
          />
          <div className="draw__panel">
            <p className="draw__hint">
              Tap inside each of your parcels — it pulls that parcel's outline from the state GIS and adds it. Tap all
              three, then Done.
            </p>
            <div className="draw__stats">
              <span>
                <strong className="num">{boundaries.length}</strong> parcel{boundaries.length === 1 ? '' : 's'} added
              </span>
              {gisLoading && <span>Looking up…</span>}
            </div>
            {gisError && <p className="parcel-card__error">{gisError}</p>}
            <div className="draw__actions">
              <button className="btn btn--ghost" onClick={() => start('boundary')}>
                Trace instead
              </button>
              <button className="btn btn--filled" onClick={exitDraw}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : mode ? (
        <div className="draw">
          <PropertyMapLive
            property={property}
            segments={segments}
            boundaries={[propertyBoundary, ...boundaries]}
            zones={zones}
            places={places}
            showElevation={showElevation}
            height={300}
            autoFit={false}
            draftPath={activePath}
            previewPolygon={
              isZone && closeToBoundary && zonePolygon.length >= 3
                ? { type: zoneType, path: zonePolygon }
                : undefined
            }
            trackMode={isGps}
            recenter={isGps && activePath.length ? activePath[activePath.length - 1] : undefined}
            onAddPoint={isGps ? undefined : (pt) => setDraftPath((p) => [...p, pt])}
          />
          <div className="draw__panel">
            {isZone && (
              <div className="seg-toggle" role="tablist" aria-label="Zone input">
                <button
                  className={`seg-toggle__btn ${mode === 'zone-gps' ? 'is-on' : ''}`}
                  onClick={() => switchZoneInput('zone-gps')}
                >
                  Walk it
                </button>
                <button
                  className={`seg-toggle__btn ${mode === 'zone' ? 'is-on' : ''}`}
                  onClick={() => switchZoneInput('zone')}
                >
                  Tap it
                </button>
              </div>
            )}
            {isGps && (
              <div className={`gps-status ${tracker.recording ? 'is-live' : ''}`}>
                <span className="gps-status__dot" />
                {tracker.recording
                  ? mode === 'zone-gps'
                    ? `Recording — walk the edge of your ${ZONE_LABELS[zoneType].toLowerCase()}`
                    : 'Recording — walk the trail'
                  : 'Paused'}
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
                  : mode === 'zone'
                    ? closeToBoundary
                      ? `Tap along the inside edge of your ${ZONE_LABELS[zoneType].toLowerCase()}. The property line closes off the rest — start and end near it.`
                      : `Tap all the way around your ${ZONE_LABELS[zoneType].toLowerCase()} area, then Save to fill it in.`
                    : mode === 'zone-gps'
                      ? closeToBoundary
                        ? `Walk the inside edge of your ${ZONE_LABELS[zoneType].toLowerCase()}, starting and ending near the property line. It closes the rest for you.`
                        : `Walk the whole perimeter of your ${ZONE_LABELS[zoneType].toLowerCase()} and back to the start, then Save.`
                      : 'Walk the trail with your phone. Points record automatically. Pause anytime, then name it and save.'}
            </p>
            {isZone && (
              <label className="draw__check">
                <input
                  type="checkbox"
                  checked={closeToBoundary}
                  onChange={(e) => setCloseToBoundary(e.target.checked)}
                />
                Close along the property line
              </label>
            )}
            <div className="draw__stats">
              <span>
                <strong className="num">{activePath.length}</strong> point{activePath.length === 1 ? '' : 's'}
              </span>
              <span>
                <strong className="num">{draftFeet.toLocaleString()}</strong> ft
                {mode === 'boundary' ? ' perimeter' : isZone ? ' of edge' : ''}
              </span>
            </div>
            {tracker.error && isGps && <p className="parcel-card__error">{tracker.error}</p>}
            {mode !== 'boundary' && !isZone && (
              <input
                className="draw__input"
                value={name}
                placeholder="Trail name (e.g. Ridge Loop)"
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <div className="draw__actions">
              {isGps ? (
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
                {mode === 'boundary'
                  ? 'Save boundary'
                  : isZone
                    ? `Save ${ZONE_LABELS[zoneType].toLowerCase()}`
                    : 'Save trail'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Land zones (lawn / field / woods) */}
          {hasMapsKey() && (
            <div className="parcel-card">
              <div className="parcel-card__head">
                <span className="label">Land zones</span>
                {zones.length > 0 && (
                  <span className="parcel-card__badge">
                    {zones.length} area{zones.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <p className="parcel-card__body">
                Shade your land by type — walk the inside edge of a lawn, field, or woods area and the property line
                closes off the rest. Add as many separate areas of each type as you like.
              </p>
              <div className="parcel-card__actions">
                <button className="btn btn--zone btn--zone-lawn" onClick={() => startZoneWalk('lawn')}>
                  + Lawn
                </button>
                <button className="btn btn--zone btn--zone-field" onClick={() => startZoneWalk('field')}>
                  + Field
                </button>
                <button className="btn btn--zone btn--zone-woods" onClick={() => startZoneWalk('woods')}>
                  + Woods
                </button>
                {zones.length > 0 && (
                  <button className="btn btn--ghost" onClick={clearZones}>
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Places */}
          {hasMapsKey() && (
            <div className="parcel-card">
              <div className="parcel-card__head">
                <span className="label">Places</span>
                {places.length > 0 && <span className="parcel-card__badge">{places.length}</span>}
              </div>
              {places.length > 0 ? (
                <div className="place-list">
                  {places.map((pl) => (
                    <div className="place-row" key={pl.id}>
                      <span className="place-row__dot" />
                      <span className="place-row__name">{pl.name}</span>
                      <button className="row-del" aria-label="Delete place" onClick={() => removePlace(pl.id)}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="parcel-card__body">
                  Mark and name spots on your property — your house, nana's house, a gate, the trailhead.
                </p>
              )}
              <div className="parcel-card__actions">
                <button
                  className="btn btn--filled"
                  onClick={() => {
                    setPlaceName('')
                    setMode('place')
                  }}
                >
                  Add a place
                </button>
              </div>
            </div>
          )}

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
