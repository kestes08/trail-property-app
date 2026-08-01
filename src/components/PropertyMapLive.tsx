import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../googleMapsLoader'
import { hasMapsKey, mapsApiKey } from '../maps'
import type { LatLng, Place, Property, TrailSegment, Zone, ZoneType } from '../types'
import { PropertyMapEmbed } from './PropertyMapEmbed'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** A pin dot with a name pill, as an SVG data-URI marker icon. */
function placeIconUrl(name: string): string {
  const w = 26 + name.length * 7.3 + 14
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='30' viewBox='0 0 ${w} 30'>` +
    `<rect x='20' y='6' rx='7' width='${name.length * 7.3 + 14}' height='18' fill='#1f3d2b' opacity='0.92'/>` +
    `<text x='27' y='19' font-family='sans-serif' font-size='12' font-weight='600' fill='#f3efe4'>${esc(name)}</text>` +
    `<circle cx='10' cy='15' r='6' fill='#c8743a' stroke='#ffffff' stroke-width='2'/>` +
    `</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const ZONE_COLORS: Record<ZoneType, { fill: string; stroke: string }> = {
  lawn: { fill: '#8ec06a', stroke: '#5f8f4a' },
  field: { fill: '#cdb15e', stroke: '#a88f3e' },
  woods: { fill: '#3f6b40', stroke: '#2c4a2c' },
}

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
  /** Property/parcel polygons (shaded) drawn beneath the trails. */
  boundaries?: LatLng[][]
  /** Land-cover zones (lawn/field/woods), filled by type. */
  zones?: Zone[]
  /** Named place markers (house, etc.). */
  places?: Place[]
  /** Overlay USGS elevation contour lines from The National Map. */
  showElevation?: boolean
  /** When false, don't auto-fit to content (e.g. while tapping to edit). */
  autoFit?: boolean
  /** GPS recording mode: draw the draft as a clean track (line + current dot). */
  trackMode?: boolean
  /** Pan the map to this point when it changes (live GPS follow). */
  recenter?: LatLng
}

// Slippy tile (x/y/z) → Web Mercator bbox "xmin,ymin,xmax,ymax" for ArcGIS export.
function tileBboxMercator(x: number, y: number, z: number): string {
  const originShift = Math.PI * 6378137
  const tileSize = (2 * originShift) / Math.pow(2, z)
  const minX = -originShift + x * tileSize
  const maxX = -originShift + (x + 1) * tileSize
  const maxY = originShift - y * tileSize
  const minY = originShift - (y + 1) * tileSize
  return `${minX},${minY},${maxX},${maxY}`
}

/**
 * Interactive Google Map (JS API): each trail segment is a colored polyline
 * with circular waypoint markers, and — when `onAddPoint` is set — tapping the
 * map traces a new trail. Falls back to the keyless embed with no API key.
 */
export function PropertyMapLive({
  property,
  segments,
  height = 176,
  onAddPoint,
  draftPath,
  boundaries,
  zones,
  places,
  showElevation,
  trackMode,
  recenter,
  autoFit = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const overlaysRef = useRef<Array<{ setMap: (m: google.maps.Map | null) => void }>>([])
  const elevationRef = useRef<google.maps.ImageMapType | null>(null)
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

    // Land-cover zones (bottom layer), filled by type.
    ;(zones ?? []).forEach((zone) => {
      if (zone.path.length < 3) return
      const c = ZONE_COLORS[zone.type]
      overlaysRef.current.push(
        new google.maps.Polygon({
          paths: zone.path,
          map,
          fillColor: c.fill,
          fillOpacity: 0.35,
          strokeColor: c.stroke,
          strokeOpacity: 0.85,
          strokeWeight: 1.5,
          clickable: false,
          zIndex: 0,
        }),
      )
      zone.path.forEach((pt) => bounds.extend(pt))
    })

    // Property / parcel polygons, drawn beneath the trails.
    ;(boundaries ?? []).forEach((poly) => {
      if (poly.length < 3) return
      overlaysRef.current.push(
        new google.maps.Polygon({
          paths: poly,
          map,
          fillColor: '#6f7a44',
          fillOpacity: 0.1,
          strokeColor: '#3d5a3f',
          strokeOpacity: 0.9,
          strokeWeight: 2,
          clickable: false,
          zIndex: 1,
        }),
      )
      poly.forEach((pt) => bounds.extend(pt))
    })

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

    // Named places (house, etc.).
    ;(places ?? []).forEach((place) => {
      const pos = { lat: place.lat, lng: place.lng }
      overlaysRef.current.push(
        new google.maps.Marker({
          position: pos,
          map,
          icon: {
            url: placeIconUrl(place.name),
            anchor: new google.maps.Point(10, 15),
          },
          zIndex: 9,
        }),
      )
      bounds.extend(pos)
    })

    // The trail being traced/recorded right now.
    if (draftPath && draftPath.length > 0) {
      if (draftPath.length >= 2) {
        overlaysRef.current.push(
          new google.maps.Polyline({ path: draftPath, map, strokeColor: '#c8743a', strokeOpacity: 1, strokeWeight: 4, zIndex: 6 }),
        )
      }
      if (trackMode) {
        // GPS: just the start point and a distinct current-position dot.
        const start = draftPath[0]
        const current = draftPath[draftPath.length - 1]
        overlaysRef.current.push(
          new google.maps.Marker({
            position: start,
            map,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 5, fillColor: '#ffffff', fillOpacity: 1, strokeColor: '#c8743a', strokeWeight: 2 },
            zIndex: 7,
          }),
        )
        overlaysRef.current.push(
          new google.maps.Marker({
            position: current,
            map,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#c8743a', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3 },
            zIndex: 8,
          }),
        )
      } else {
        // Tap-plotting: a marker at every vertex so each tap is visible.
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
    }

    // Fit to the property (boundary + trails) when not mid-trace, so panning
    // during drawing isn't interrupted by a recenter on each tap.
    if (autoFit && (!draftPath || draftPath.length === 0) && !bounds.isEmpty()) {
      map.fitBounds(bounds, 28)
    }
  }, [ready, segments, draftPath, boundaries, zones, places, trackMode, autoFit])

  // Live GPS follow: keep the current position centered while recording.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map || !recenter) return
    map.panTo(recenter)
  }, [ready, recenter?.lat, recenter?.lng])

  // Toggle the USGS elevation-contour tile overlay.
  useEffect(() => {
    const map = mapRef.current
    if (!ready || typeof google === 'undefined' || !map) return
    if (!elevationRef.current) {
      elevationRef.current = new google.maps.ImageMapType({
        name: 'USGS Contours',
        tileSize: new google.maps.Size(256, 256),
        opacity: 0.85,
        getTileUrl: (coord, zoom) => {
          // Request each 256px tile at 512px. The service picks its contour
          // detail from image-size-vs-extent, so oversizing pulls in the finer
          // intermediate contours; the browser scales the result back to 256.
          const params = new URLSearchParams({
            bbox: tileBboxMercator(coord.x, coord.y, zoom),
            bboxSR: '3857',
            imageSR: '3857',
            size: '512,512',
            format: 'png32',
            transparent: 'true',
            dpi: '96',
            f: 'image',
          })
          return `https://carto.nationalmap.gov/arcgis/rest/services/contours/MapServer/export?${params.toString()}`
        },
      })
    }
    const overlays = map.overlayMapTypes
    const idx = overlays.getArray().indexOf(elevationRef.current)
    if (showElevation && idx === -1) overlays.push(elevationRef.current)
    if (!showElevation && idx !== -1) overlays.removeAt(idx)
  }, [ready, showElevation])

  if (failed || !hasMapsKey()) {
    return <PropertyMapEmbed property={property} height={height} />
  }
  return <div ref={containerRef} className="map-card__frame" style={{ height }} />
}
