import type {
  Property,
  TrailSegment,
  Task,
  Equipment,
  WeatherSnapshot,
} from './types'

export const property: Property = {
  name: 'Hollow Ridge',
  location: 'Crozet, VA',
  acreage: 15,
  owner: 'Kaleb',
  // Rural land west of Crozet toward the Blue Ridge. Swap these for the
  // property's real coordinates to recenter the embedded map.
  lat: 38.0546,
  lng: -78.7268,
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
