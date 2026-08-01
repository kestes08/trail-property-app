import type { Equipment, LatLng, Place, Task, TrailSegment, Zone } from './types'

// Bump the version if the stored shape changes in a breaking way. v2 also
// clears the earlier example data that v1 had saved to the browser.
const STORAGE_KEY = 'hollow-ridge.v2'

export interface PersistedState {
  segments: TrailSegment[]
  tasks: Task[]
  equipment: Equipment[]
  boundaries?: LatLng[][]
  /** Legacy single boundary — migrated to `boundaries` on load. */
  boundary?: LatLng[] | null
  zones?: Zone[]
  places?: Place[]
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
