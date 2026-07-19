export interface Property {
  name: string
  location: string
  acreage: number
  owner: string
  /** Map center for the embedded Google Map. */
  lat: number
  lng: number
}

export type SegmentStatus = 'done' | 'in_progress' | 'planned'

export interface LatLng {
  lat: number
  lng: number
}

export interface TrailSegment {
  id: string
  name: string
  percentComplete: number
  feetComplete: number
  feetTotal: number
  status: SegmentStatus
  aiFlagged?: boolean
  /** Ordered polyline drawn on the live map. */
  path?: LatLng[]
}

export type TaskModule = 'trail' | 'yard' | 'equipment'
export type YardZone = 'Meadow' | 'Garden' | 'Drive'

export interface Task {
  id: string
  title: string
  module: TaskModule
  zone?: YardZone
  dueDate: string // ISO date
  done: boolean
  loggedByAI?: boolean
  durationMin?: number
}

export type EquipmentStatus = 'good' | 'watch' | 'due'

export interface Equipment {
  id: string
  name: string
  hoursSinceService: number
  serviceIntervalHours: number
  status: EquipmentStatus
  initials: string
}

export interface RecordUpdate {
  field: string
  from: string
  to: string
}

export interface ChatMessage {
  id: string
  role: 'ai' | 'user'
  text: string
  recordUpdate?: RecordUpdate[]
  chips?: string[]
}

export interface WeatherSnapshot {
  tempF: number
  condition: string
  rainIncoming: boolean
}
