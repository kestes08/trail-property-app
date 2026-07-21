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
  condition: 'Rain by evening',
  rainIncoming: true,
}

// Ordered ridge → creek. The lowest-progress in-progress segment is the one
// the assistant flags against incoming rain (drainage before ground softens).
// No trails yet — Kaleb plots his own on the map (Trail Builder screen), and
// each plotted segment is stored with its path and tracked from there.
export const trailSegments: TrailSegment[] = []

export const tasks: Task[] = [
  {
    id: 'task-mow-meadow',
    title: 'Mow the lower meadow',
    module: 'yard',
    zone: 'Meadow',
    dueDate: '2026-07-21',
    done: false,
    durationMin: 90,
  },
  {
    id: 'task-weed-beds',
    title: 'Weed the raised beds',
    module: 'yard',
    zone: 'Garden',
    dueDate: '2026-07-22',
    done: false,
    durationMin: 45,
  },
  {
    id: 'task-gravel-drive',
    title: 'Regrade washboard on the drive',
    module: 'yard',
    zone: 'Drive',
    dueDate: '2026-07-28',
    done: false,
    durationMin: 120,
  },
  {
    id: 'task-mower-service',
    title: 'Change mower oil + blade',
    module: 'equipment',
    dueDate: '2026-07-23',
    done: false,
  },
  {
    id: 'task-clear-culvert',
    title: 'Clear the driveway culvert',
    module: 'yard',
    zone: 'Drive',
    dueDate: '2026-07-19',
    done: true,
    loggedByAI: true,
  },
]

export const equipment: Equipment[] = [
  {
    id: 'eq-mower',
    name: 'Zero-turn Mower',
    hoursSinceService: 48,
    serviceIntervalHours: 50,
    status: 'due',
    initials: 'ZM',
  },
  {
    id: 'eq-chainsaw',
    name: 'Chainsaw (16")',
    hoursSinceService: 22,
    serviceIntervalHours: 30,
    status: 'watch',
    initials: 'CS',
  },
  {
    id: 'eq-trimmer',
    name: 'String Trimmer',
    hoursSinceService: 9,
    serviceIntervalHours: 40,
    status: 'good',
    initials: 'ST',
  },
  {
    id: 'eq-mattock',
    name: 'Trail Mattock',
    hoursSinceService: 4,
    serviceIntervalHours: 60,
    status: 'good',
    initials: 'TM',
  },
  {
    id: 'eq-tractor',
    name: 'Compact Tractor',
    hoursSinceService: 31,
    serviceIntervalHours: 100,
    status: 'good',
    initials: 'CT',
  },
]
