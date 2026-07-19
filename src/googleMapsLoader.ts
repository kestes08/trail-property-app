/**
 * Loads the Google Maps JavaScript API once and resolves when `google.maps`
 * is ready. Subsequent calls reuse the same in-flight/finished promise.
 */
let loader: Promise<typeof google.maps> | null = null

export function loadGoogleMaps(apiKey: string): Promise<typeof google.maps> {
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }
  if (loader) return loader

  loader = new Promise((resolve, reject) => {
    const callbackName = `__initGoogleMaps_${Math.random().toString(36).slice(2)}`
    ;(window as unknown as Record<string, () => void>)[callbackName] = () => {
      resolve(window.google.maps)
      delete (window as unknown as Record<string, unknown>)[callbackName]
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&v=weekly&callback=${callbackName}`
    script.async = true
    script.onerror = () => {
      loader = null
      reject(new Error('Failed to load the Google Maps JavaScript API'))
    }
    document.head.appendChild(script)
  })
  return loader
}
