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
  const wakeLock = useRef<WakeLockSentinel | null>(null)

  const acquireWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLock.current = await navigator.wakeLock.request('screen')
      }
    } catch {
      // Not supported / denied — recording still works, screen may just sleep.
    }
  }, [])

  const releaseWakeLock = useCallback(() => {
    wakeLock.current?.release().catch(() => {})
    wakeLock.current = null
  }, [])

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
    void acquireWakeLock()
  }, [onPosition, onError, acquireWakeLock])

  const pause = useCallback(() => {
    clearWatch()
    releaseWakeLock()
    setRecording(false)
  }, [clearWatch, releaseWakeLock])

  const reset = useCallback(() => {
    clearWatch()
    releaseWakeLock()
    pointsRef.current = []
    setPoints([])
    setAccuracy(null)
    setError(null)
    setRecording(false)
  }, [clearWatch, releaseWakeLock])

  // The screen wake lock drops when the tab is hidden; re-acquire on return.
  useEffect(() => {
    const onVisible = () => {
      if (recording && document.visibilityState === 'visible') void acquireWakeLock()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [recording, acquireWakeLock])

  // Clean up the watch and wake lock if the component unmounts mid-recording.
  useEffect(
    () => () => {
      clearWatch()
      releaseWakeLock()
    },
    [clearWatch, releaseWakeLock],
  )

  return { points, recording, accuracy, error, start, pause, reset }
}
