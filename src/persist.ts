import type { Equipment, LatLng, Task, TrailSegment } from './types'

// Bump the version if the stored shape changes in a breaking way.
const STORAGE_KEY = 'hollow-ridge.v1'

export interface PersistedState {
  segments: TrailSegment[]
  tasks: Task[]
  equipment: Equipment[]
  boundary?: LatLng[] | null
}

/** Load saved data from the browser, or null if there is none / it's unreadable. */
export function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedState) : null
  } catch {
    return null
  }
}

/** Persist the real data (trails, tasks, equipment) to the browser. */
export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore write failures (private mode / quota); the app still works in-memory.
  }
}
