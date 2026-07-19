import type { Property } from './types'

const ZOOM = 14

/** Google Maps API key, if the app was built with one. */
export const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

/** With a key we can render the JS map (trail overlays); without one we use the
 *  keyless embed iframe, which cannot draw custom overlays. */
export const hasMapsKey = (): boolean => Boolean(mapsApiKey)

/**
 * Source URL for the embedded, interactive map iframe.
 *
 * If `VITE_GOOGLE_MAPS_API_KEY` is set, use the official Maps Embed API
 * (satellite view, cleaner UI). Otherwise fall back to the keyless
 * `output=embed` map, which is still fully interactive (pan / zoom / click
 * through to Google Maps) and needs no account or billing.
 */
export function mapEmbedSrc(p: Property): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (key) {
    return `https://www.google.com/maps/embed/v1/view?key=${key}&center=${p.lat},${p.lng}&zoom=${ZOOM}&maptype=satellite`
  }
  return `https://maps.google.com/maps?q=${p.lat},${p.lng}&z=${ZOOM}&hl=en&output=embed`
}

/** Deep link that opens the location full-screen in Google Maps. */
export function mapExternalUrl(p: Property): string {
  return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`
}
