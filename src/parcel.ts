import type { LatLng } from './types'

// Virginia statewide parcels (VGIN / VDEM), an ArcGIS FeatureServer. Boundaries
// are for cartographic use — approximate, not a legal survey.
const PARCEL_QUERY =
  'https://gismaps.vdem.virginia.gov/arcgis/rest/services/VA_Base_Layers/VA_Parcels/FeatureServer/0/query'

export interface ParcelResult {
  boundary: LatLng[]
  parcelId?: string
}

/**
 * ArcGIS query over JSONP. Browsers block cross-origin `fetch` to services that
 * don't send CORS headers (which is why the plain fetch failed), but a JSONP
 * `<script>` request isn't subject to CORS. ArcGIS supports it via `callback`.
 */
function arcgisJsonp(baseUrl: string, params: Record<string, string>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const cbName = `__arcgisCb_${Math.random().toString(36).slice(2)}`
    const script = document.createElement('script')
    let settled = false

    const cleanup = () => {
      delete (window as unknown as Record<string, unknown>)[cbName]
      script.remove()
    }
    ;(window as unknown as Record<string, (data: unknown) => void>)[cbName] = (data) => {
      settled = true
      cleanup()
      resolve(data)
    }

    const qs = new URLSearchParams({ ...params, f: 'json', callback: cbName }).toString()
    script.src = `${baseUrl}?${qs}`
    script.onerror = () => {
      if (!settled) {
        cleanup()
        reject(new Error('Parcel service unreachable'))
      }
    }
    document.head.appendChild(script)

    window.setTimeout(() => {
      if (!settled) {
        cleanup()
        reject(new Error('Parcel service timed out'))
      }
    }, 15000)
  })
}

interface ArcGISFeature {
  attributes?: Record<string, unknown>
  geometry?: { rings?: number[][][] }
}
interface ArcGISResponse {
  features?: ArcGISFeature[]
  error?: { message?: string }
}

/** Look up the parcel polygon containing a point. Returns null if none found. */
export async function fetchParcelAt(lat: number, lng: number): Promise<ParcelResult | null> {
  const data = (await arcgisJsonp(PARCEL_QUERY, {
    where: '1=1',
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true',
  })) as ArcGISResponse

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
