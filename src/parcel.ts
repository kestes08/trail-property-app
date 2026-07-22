import type { LatLng } from './types'

// Virginia statewide parcels (VGIN / VDEM), an ArcGIS FeatureServer. Boundaries
// are for cartographic use — approximate, not a legal survey.
const PARCEL_QUERY =
  'https://gismaps.vdem.virginia.gov/arcgis/rest/services/VA_Base_Layers/VA_Parcels/FeatureServer/0/query'

// Public CORS proxy used only if the service refuses a direct browser request
// (it sends no CORS headers). It fetches server-side and echoes the JSON back
// with CORS headers. Only public parcel data passes through it.
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

export interface ParcelResult {
  boundary: LatLng[]
  parcelId?: string
}

interface ArcGISFeature {
  attributes?: Record<string, unknown>
  geometry?: { rings?: number[][][] }
}
interface ArcGISResponse {
  features?: ArcGISFeature[]
  error?: { message?: string }
}

async function queryArcgis(url: string): Promise<ArcGISResponse> {
  // 1) Direct — works if the service happens to send CORS headers.
  try {
    const res = await fetch(url)
    if (res.ok) return (await res.json()) as ArcGISResponse
  } catch {
    // CORS / network blocked — fall through to the proxy.
  }
  // 2) Via a public CORS proxy.
  const res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error(`Parcel service returned ${res.status}`)
  return (await res.json()) as ArcGISResponse
}

/** Look up the parcel polygon containing a point. Returns null if none found. */
export async function fetchParcelAt(lat: number, lng: number): Promise<ParcelResult | null> {
  const params = new URLSearchParams({
    where: '1=1',
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true',
    f: 'json',
  })
  const data = await queryArcgis(`${PARCEL_QUERY}?${params.toString()}`)
  if (data.error) throw new Error(data.error.message || 'Parcel service error')

  const feature = data.features?.[0]
  const rings = feature?.geometry?.rings
  if (!rings || rings.length === 0) return null

  // Largest ring = outer boundary (ignores small holes/islands).
  const outer = rings.reduce((a, b) => (b.length > a.length ? b : a), rings[0])
  const boundary: LatLng[] = outer.map((c) => ({ lat: c[1], lng: c[0] }))

  const attrs = feature?.attributes ?? {}
  const rawId = attrs.PARCELID ?? attrs.GPIN ?? attrs.LOCALPARCELID
  return { boundary, parcelId: rawId != null ? String(rawId) : undefined }
}
