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
export const trailSegments: TrailSegment[] = [
  {
    id: 'seg-switchbacks',
    name: 'Upper Switchbacks',
    percentComplete: 92,
    feetComplete: 552,
    feetTotal: 600,
    status: 'in_progress',
  },
  {
    id: 'seg-ridgeline',
    name: 'Ridgeline Traverse',
    percentComplete: 74,
    feetComplete: 1036,
    feetTotal: 1400,
    status: 'in_progress',
  },
  {
    id: 'seg-creek-drainage',
    name: 'Creek Drainage',
    percentComplete: 38,
    feetComplete: 190,
    feetTotal: 500,
    status: 'in_progress',
    aiFlagged: true,
  },
  {
    id: 'seg-meadow-connector',
    name: 'Meadow Connector',
    percentComplete: 0,
    feetComplete: 0,
    feetTotal: 720,
    status: 'planned',
  },
]

export const tasks: Task[] = [
  {
    id: 'task-drainage',
    title: 'Cut drainage on Creek section',
    module: 'trail',
    dueDate: '2026-07-20',
    done: false,
  },
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
