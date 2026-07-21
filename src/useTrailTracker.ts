import { useCallback, useEffect, useRef, useState } from 'react'
import { distanceMeters } from './geo'
import type { LatLng } from './types'

// Drop fixes worse than this once we have a track going (meters).
const MAX_ACCURACY_M = 40
// Ignore GPS jitter: require this much movement before recording a new point.
const MIN_STEP_M = 2.5

export interface TrailTracker {
  points: LatLng[]
  recording: boolean
  accuracy: number | null
  error: string | null
  start: () => void
  pause: () => void
  reset: () => void
}

/**
 * Records a trail by following the phone's GPS while the user walks it.
 * Uses the browser Geolocation API (requires HTTPS + user permission).
 */
export function useTrailTracker(): TrailTracker {
  const [points, setPoints] = useState<LatLng[]>([])
  const [recording, setRecording] = useState(false)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watchId = useRef<number | null>(null)
  const pointsRef = useRef<LatLng[]>([])

  const clearWatch = useCallback(() => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }, [])

  const onPosition = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy: acc } = pos.coords
    setAccuracy(acc)
    const pt = { lat: latitude, lng: longitude }
    const existing = pointsRef.current
    const last = existing[existing.length - 1]
    // Once a track is going, drop poor fixes and tiny jitter.
    if (existing.length > 0) {
      if (acc > MAX_ACCURACY_M) return
      if (last && distanceMeters(last, pt) < MIN_STEP_M) return
    }
    pointsRef.current = [...existing, pt]
    setPoints(pointsRef.current)
  }, [])

  const onError = useCallback(
    (err: GeolocationPositionError) => {
      setError(
        err.code === err.PERMISSION_DENIED
          ? 'Location permission denied. Enable it for this site, or plot by tapping instead.'
          : 'Could not get a location fix. Make sure you have a clear view of the sky.',
      )
      setRecording(false)
      clearWatch()
    },
    [clearWatch],
  )

  const start = useCallback(() => {
    setError(null)
    if (!('geolocation' in navigator)) {
      setError('This device does not support location.')
      return
    }
    if (watchId.current != null) return
    watchId.current = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 20000,
    })
    setRecording(true)
  }, [onPosition, onError])

  const pause = useCallback(() => {
    clearWatch()
    setRecording(false)
  }, [clearWatch])

  const reset = useCallback(() => {
    clearWatch()
    pointsRef.current = []
    setPoints([])
    setAccuracy(null)
    setError(null)
    setRecording(false)
  }, [clearWatch])

  // Clean up the watch if the component unmounts mid-recording.
  useEffect(() => () => clearWatch(), [clearWatch])

  return { points, recording, accuracy, error, start, pause, reset }
}
