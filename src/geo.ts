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

// --- Closing a walked zone edge along the property boundary ------------------

type XY = { x: number; y: number }

/** Local equirectangular projection to meters, good for small areas. */
function toXY(p: LatLng, ref: LatLng): XY {
  const R = 6371000
  const rad = Math.PI / 180
  return {
    x: (p.lng - ref.lng) * rad * Math.cos(ref.lat * rad) * R,
    y: (p.lat - ref.lat) * rad * R,
  }
}

function lerpLatLng(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

/** Closest point on the closed boundary to P: which edge, how far along it. */
function projectToBoundary(p: LatLng, boundary: LatLng[], ref: LatLng) {
  const P = toXY(p, ref)
  let best = { edge: 0, t: 0, dist: Infinity }
  for (let i = 0; i < boundary.length; i++) {
    const a = toXY(boundary[i], ref)
    const b = toXY(boundary[(i + 1) % boundary.length], ref)
    const abx = b.x - a.x
    const aby = b.y - a.y
    const len2 = abx * abx + aby * aby
    let t = len2 > 0 ? ((P.x - a.x) * abx + (P.y - a.y) * aby) / len2 : 0
    t = Math.max(0, Math.min(1, t))
    const cx = a.x + abx * t
    const cy = a.y + aby * t
    const dist = Math.hypot(P.x - cx, P.y - cy)
    if (dist < best.dist) best = { edge: i, t, dist }
  }
  return best
}

function arcLength(pts: LatLng[]): number {
  let m = 0
  for (let i = 1; i < pts.length; i++) m += distanceMeters(pts[i - 1], pts[i])
  return m
}

/**
 * Close an open, walked zone edge into a filled polygon by connecting its two
 * ends along the property boundary. You walk only the interior edge of a zone
 * (yard, woods…) that runs up against the property line; this snaps each end to
 * the nearest point on the line and follows the shorter arc of the line between
 * them to complete the shape. Returns the walked path unchanged if it can't.
 */
export function closeAlongBoundary(walked: LatLng[], boundary: LatLng[]): LatLng[] {
  if (walked.length < 2 || boundary.length < 3) return walked
  const m = boundary.length
  const ref = boundary[0]
  const S = walked[0]
  const E = walked[walked.length - 1]
  const pS = projectToBoundary(S, boundary, ref)
  const pE = projectToBoundary(E, boundary, ref)
  const projS = lerpLatLng(boundary[pS.edge], boundary[(pS.edge + 1) % m], pS.t)
  const projE = lerpLatLng(boundary[pE.edge], boundary[(pE.edge + 1) % m], pE.t)

  // Forward arc: boundary vertices from just past pE's edge up to pS's edge.
  const fwd: LatLng[] = []
  if (!(pE.edge === pS.edge && pE.t <= pS.t)) {
    let k = (pE.edge + 1) % m
    for (let step = 0; step <= m; step++) {
      fwd.push(boundary[k])
      if (k === pS.edge) break
      k = (k + 1) % m
    }
  }
  // Backward arc: boundary vertices walking the other way.
  const bwd: LatLng[] = []
  if (!(pE.edge === pS.edge && pE.t >= pS.t)) {
    let k = pE.edge
    for (let step = 0; step <= m; step++) {
      bwd.push(boundary[k])
      if (k === (pS.edge + 1) % m) break
      k = (k - 1 + m) % m
    }
  }

  const fwdLen = arcLength([projE, ...fwd, projS])
  const bwdLen = arcLength([projE, ...bwd, projS])
  const arc = fwdLen <= bwdLen ? fwd : bwd
  return [...walked, projE, ...arc, projS]
}
