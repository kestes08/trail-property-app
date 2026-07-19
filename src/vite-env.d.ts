/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional Google Maps API key. When set, the map card uses the official
   *  Maps Embed API (satellite view); otherwise it falls back to the keyless
   *  interactive embed. */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
