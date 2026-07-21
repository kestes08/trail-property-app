import type {
  Property,
  TrailSegment,
  Task,
  Equipment,
  WeatherSnapshot,
} from './types'

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
