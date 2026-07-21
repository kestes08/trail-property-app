import type { LatLng } from './types'

// Virginia statewide parcels (VGIN / VDEM), an ArcGIS FeatureServer. Boundaries
// are for cartographic use — approximate, not a legal survey. The query runs in
// the user's browser; if the service is unreachable or blocks CORS, the caller
// falls back to manual tracing.
const PARCEL_QUERY =
  'https://gismaps.vdem.virginia.gov/arcgis/rest/services/VA_Base_Layers/VA_Parcels/FeatureServer/0/query'

export interface ParcelResult {
  boundary: LatLng[]
  parcelId?: string
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

  const res = await fetch(`${PARCEL_QUERY}?${params.toString()}`)
  if (!res.ok) throw new Error(`Parcel service returned ${res.status}`)
  const data = await res.json()

  const feature = data?.features?.[0]
  const rings: number[][][] | undefined = feature?.geometry?.rings
  if (!rings || rings.length === 0) return null

  // Use the largest ring as the outer boundary (ignores small holes/islands).
  const outer = rings.reduce((a, b) => (b.length > a.length ? b : a), rings[0])
  const boundary: LatLng[] = outer.map((c) => ({ lat: c[1], lng: c[0] }))

  const attrs = feature.attributes ?? {}
  const rawId = attrs.PARCELID ?? attrs.GPIN ?? attrs.LOCALPARCELID
  return { boundary, parcelId: rawId != null ? String(rawId) : undefined }
}
