import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../googleMapsLoader'
import { hasMapsKey, mapsApiKey } from '../maps'
import type { LatLng, Property, TrailSegment } from '../types'
import { PropertyMapEmbed } from './PropertyMapEmbed'

/** Trail line color, mirroring the segment coloring used in the Trail Builder. */
function segmentColor(seg: TrailSegment): string {
  if (seg.status === 'planned') return '#6f7a44' // olive
  if (seg.aiFlagged) return '#c8743a' // accent — flagged by the assistant
  if (seg.percentComplete >= 70) return '#3f8560' // green — near done
  if (seg.percentComplete < 40) return '#8a988c' // muted — low progress
  return '#6f7a44' // olive — mid
}

interface Props {
  property: Property
  segments: TrailSegment[]
  height?: number
  /** When set, tapping the map reports the point (drawing mode). */
  onAddPoint?: (point: LatLng) => void
  /** In-progress path being traced, drawn on top in the accent color. */
  draftPath?: LatLng[]
}

/**
 * Interactive Google Map (JS API): each trail segment is a colored polyline
 * with circular waypoint markers, and — when `onAddPoint` is set — tapping the
 * map traces a new trail. Falls back to the keyless embed with no API key.
 */
export function PropertyMapLive({ property, segments, height = 176, onAddPoint, draftPath }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const overlaysRef = useRef<Array<{ setMap: (m: google.maps.Map | null) => void }>>([])
  const addPointRef = useRef<Props['onAddPoint']>(onAddPoint)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  // Keep the latest click handler without re-binding the map listener.
  addPointRef.current = onAddPoint

  useEffect(() => {
    if (!mapsApiKey) return
    let cancelled = false
    loadGoogleMaps(mapsApiKey)
      .then((maps) => {
        if (cancelled || !containerRef.current) return
        const map = new maps.Map(containerRef.current, {
          center: { lat: property.lat, lng: property.lng },
          zoom: 16,
          mapTypeId: 'terrain',
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
        })
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng && addPointRef.current) {
            addPointRef.current({ lat: e.latLng.lat(), lng: e.latLng.lng() })
          }
        })
        mapRef.current = map
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [property.lat, property.lng])

  // (Re)draw overlays whenever the data or the in-progress path changes.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || typeof google === 'undefined' || !map) return

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
        icons: planned
          ? [{ icon: { path: 'M 0,-1 0,1', strokeColor: color, strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '12px' }]
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
      overlaysRef.current.push(
        new google.maps.Marker({
          position: pt,
          map,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 5, fillColor: '#c8743a', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
          zIndex: 5,
        }),
      )
    })

    // The trail being traced right now.
    if (draftPath && draftPath.length > 0) {
      if (draftPath.length >= 2) {
        overlaysRef.current.push(
          new google.maps.Polyline({ path: draftPath, map, strokeColor: '#c8743a', strokeOpacity: 1, strokeWeight: 4, zIndex: 6 }),
        )
      }
      draftPath.forEach((pt, i) => {
        overlaysRef.current.push(
          new google.maps.Marker({
            position: pt,
            map,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: i === 0 ? 6 : 4, fillColor: '#ffffff', fillOpacity: 1, strokeColor: '#c8743a', strokeWeight: 2 },
            zIndex: 7,
          }),
        )
      })
    }

    // Fit to the trails only when not actively drawing (avoids recentering on each tap).
    if (!draftPath && !bounds.isEmpty()) {
      map.fitBounds(bounds, 28)
    }
  }, [ready, segments, draftPath])

  if (failed || !hasMapsKey()) {
    return <PropertyMapEmbed property={property} height={height} />
  }
  return <div ref={containerRef} className="map-card__frame" style={{ height }} />
}
