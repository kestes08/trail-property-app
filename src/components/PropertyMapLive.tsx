import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../googleMapsLoader'
import { hasMapsKey, mapsApiKey } from '../maps'
import type { Property, TrailSegment } from '../types'
import { PropertyMapEmbed } from './PropertyMapEmbed'

/** Trail line color, mirroring the segment coloring used in the Trail Builder. */
function segmentColor(seg: TrailSegment): string {
  if (seg.status === 'planned') return '#6f7a44' // olive
  if (seg.aiFlagged) return '#c8743a' // accent — flagged by the assistant
  if (seg.percentComplete >= 70) return '#3f8560' // green — near done
  if (seg.percentComplete < 40) return '#8a988c' // muted — low progress
  return '#6f7a44' // olive — mid
}

/**
 * Interactive Google Map (JS API) with each trail segment drawn as a colored
 * polyline and circular waypoint markers at the segment junctions. Falls back
 * to the keyless embed if there is no API key or the script fails to load.
 */
export function PropertyMapLive({
  property,
  segments,
  height = 176,
}: {
  property: Property
  segments: TrailSegment[]
  height?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const overlaysRef = useRef<Array<{ setMap: (m: google.maps.Map | null) => void }>>([])
  const [failed, setFailed] = useState(false)

  // Create the map once.
  useEffect(() => {
    if (!mapsApiKey) return
    let cancelled = false
    loadGoogleMaps(mapsApiKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return
        mapRef.current = new maps.Map(containerRef.current, {
          center: { lat: property.lat, lng: property.lng },
          zoom: 15,
          mapTypeId: 'terrain',
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
        })
        drawOverlays()
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redraw whenever the segments change (e.g. after the AI logs progress).
  useEffect(() => {
    drawOverlays()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments])

  function drawOverlays() {
    const map = mapRef.current
    if (typeof google === 'undefined' || !map) return

    // Clear previous overlays.
    overlaysRef.current.forEach((o) => o.setMap(null))
    overlaysRef.current = []

    const bounds = new google.maps.LatLngBounds()
    const waypoints = new Map<string, google.maps.LatLngLiteral>()

    segments.forEach((seg) => {
      if (!seg.path || seg.path.length < 2) return
      const color = segmentColor(seg)
      const planned = seg.status === 'planned'

      const line = new google.maps.Polyline({
        path: seg.path,
        map,
        strokeColor: color,
        strokeOpacity: planned ? 0 : 0.95,
        strokeWeight: 4,
        // Planned segment renders as a dashed line.
        icons: planned
          ? [
              {
                icon: {
                  path: 'M 0,-1 0,1',
                  strokeColor: color,
                  strokeOpacity: 1,
                  scale: 3,
                },
                offset: '0',
                repeat: '12px',
              },
            ]
          : undefined,
      })
      overlaysRef.current.push(line)

      seg.path.forEach((pt) => bounds.extend(pt))
      const start = seg.path[0]
      const end = seg.path[seg.path.length - 1]
      waypoints.set(`${start.lat},${start.lng}`, start)
      waypoints.set(`${end.lat},${end.lng}`, end)
    })

    waypoints.forEach((pt) => {
      const marker = new google.maps.Marker({
        position: pt,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: '#c8743a',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: 5,
      })
      overlaysRef.current.push(marker)
    })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 28)
    }
  }

  if (failed || !hasMapsKey()) {
    return <PropertyMapEmbed property={property} height={height} />
  }

  return <div ref={containerRef} className="map-card__frame" style={{ height }} />
}
