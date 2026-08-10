import { PropertyMapLive } from '../components/PropertyMapLive'
import { propertyBoundary } from '../data'
import { hasMapsKey } from '../maps'
import { useStore } from '../store'

/** Full-screen interactive property map — a dedicated tab. Mirrors the overlay
 *  toggles from the home card so the whole property reads at a glance. */
export function MapScreen() {
  const {
    property,
    segments,
    boundaries,
    zones,
    places,
    showBoundary,
    showElevation,
    showZones,
    toggleBoundary,
    toggleElevation,
    toggleZones,
  } = useStore()

  return (
    <div className="map-screen">
      <PropertyMapLive
        property={property}
        segments={segments}
        boundaries={showBoundary ? [propertyBoundary, ...boundaries] : []}
        zones={showZones ? zones : []}
        places={places}
        showElevation={showElevation}
        height="100%"
      />

      {hasMapsKey() && (
        <div className="map-screen__toggles">
          <button
            className={`toggle-chip ${showBoundary ? 'is-on' : ''}`}
            aria-pressed={showBoundary}
            onClick={toggleBoundary}
          >
            <span className="toggle-chip__dot" style={{ background: '#3d5a3f' }} />
            Property lines
          </button>
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
    </div>
  )
}
