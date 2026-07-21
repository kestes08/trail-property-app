import type { LatLng } from './types'

// Mean Earth radius in feet (6,371,000 m × 3.28084).
const EARTH_RADIUS_FT = 20902231

function segmentFeet(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_FT * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Total length of a lat/lng path, in feet (great-circle, no Google needed). */
export function pathLengthFeet(path: LatLng[]): number {
  let ft = 0
  for (let i = 1; i < path.length; i++) ft += segmentFeet(path[i - 1], path[i])
  return Math.round(ft)
}

/** Distance between two points in meters. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  return segmentFeet(a, b) / 3.28084
}
