import { mapEmbedSrc } from '../maps'
import type { Property } from '../types'

/** Interactive, embedded Google Map centered on the property. */
export function PropertyMapEmbed({
  property,
  height = 176,
}: {
  property: Property
  height?: number | string
}) {
  return (
    <iframe
      className="map-card__frame"
      title={`Map of ${property.name}`}
      src={mapEmbedSrc(property)}
      height={height}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  )
}
