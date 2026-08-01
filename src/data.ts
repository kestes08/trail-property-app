import type {
  LatLng,
  Property,
  TrailSegment,
  Task,
  Equipment,
  WeatherSnapshot,
} from './types'

// The property outline (all three parcels combined), traced from the county
// parcel map and georeferenced to two surveyed corners. Approximate, not a
// survey. Always drawn on the map beneath any user-added parcels/zones.
export const propertyBoundary: LatLng[] = [
  { lat: 38.056296, lng: -78.76073 },
  { lat: 38.056291, lng: -78.75953 },
  { lat: 38.05432, lng: -78.756372 },
  { lat: 38.054183, lng: -78.756228 },
  { lat: 38.05359, lng: -78.7564 },
  { lat: 38.054298, lng: -78.757365 },
  { lat: 38.054265, lng: -78.757531 },
  { lat: 38.054592, lng: -78.75942 },
  { lat: 38.054586, lng: -78.759489 },
  { lat: 38.053568, lng: -78.759592 },
  { lat: 38.053601, lng: -78.760743 },
  { lat: 38.054679, lng: -78.761171 },
  { lat: 38.054467, lng: -78.763646 },
  { lat: 38.05616, lng: -78.76286 },
  { lat: 38.056106, lng: -78.762653 },
]

export const property: Property = {
  name: 'Hollow Ridge',
  address: '2045 Upper Stony Run',
  location: 'Crozet, VA',
  acreage: 15,
  owner: 'Kaleb',
  // Property center (from the owner's dropped pin).
  lat: 38.055368935776976,
  lng: -78.76151470610499,
}

export const weather: WeatherSnapshot = {
  tempF: 64,
  condition: 'Clear',
  rainIncoming: false,
}

// Blank slate — the owner enters their own trails, tasks, and equipment.
export const trailSegments: TrailSegment[] = []

export const tasks: Task[] = []

export const equipment: Equipment[] = []
