# Hollow Ridge

A mobile-first property management app for a 15-acre rural property in Crozet, VA.
Built with Vite + React + TypeScript and plain CSS (no UI framework). The layout
targets an iPhone-class viewport (390×844) and renders inside a phone frame on
larger screens.

## Modules

- **Home** — property header, an interactive embedded Google Map, stat cards
  (trails built / open tasks / tools logged), and an upcoming-tasks list pulled
  from every module.
- **Trail Builder** — overall gradient progress, a weather-aware AI suggestion
  card, and a per-segment list (a flagged segment is tagged `SUGGESTED`; the
  final planned segment shows as a dashed placeholder).
- **Ranger (AI assistant)** — full-screen chat on forest green. Logging work in
  natural language returns a conversational reply *and* a structured
  "✓ Record updated" card showing the field/old→new diff that was applied.
- **Yard Tasks** — summary banner, zone filter chips, This week / Later groups,
  and a dimmed strikethrough row for AI-logged completions.
- **Equipment Log** — maintenance-alert card, and a gear list with status pills
  (DUE / WATCH / GOOD).
- **Stats** — aggregate rollup across all modules.

A persistent AI prompt bar sits at the bottom of every screen (forest green
elsewhere, inverted to cream on the Ranger screen). Typing free text routes it
through the natural-language handler in `src/ai.ts`.

## AI behavior

`src/ai.ts` is a rule-based intent parser (`interpret(text, state)`) with a
signature designed to be swapped for a real LLM call later. It classifies input
into `log-progress`, `log-task-complete`, `log-maintenance`, or `question`, then
returns a reply, an optional record-update diff, follow-up chips, and a state
patch. Every write from natural language is surfaced visibly — a chat bubble +
record card on the Ranger screen, or a toast on the other screens — and the new
values propagate everywhere they are shown (dashboard stat card, trail list,
etc.). Nothing is mutated silently.

## Data model

See `src/types.ts` — `Property`, `TrailSegment`, `Task`, `Equipment`,
`ChatMessage` (with an optional `recordUpdate` diff), and `WeatherSnapshot`.
Seed data lives in `src/data.ts`; shared state and actions are in `src/store.tsx`.

## Map

The Home screen shows an interactive Google Map centered on the coordinates in
`property` (`src/data.ts`). It has two modes:

- **With a Google Maps API key** (`VITE_GOOGLE_MAPS_API_KEY`, see `.env.example`)
  — `src/components/PropertyMapLive.tsx` loads the Maps JavaScript API and draws
  each trail segment as a colored polyline (green = near done, amber = flagged by
  the assistant, olive/gray = in progress, dashed olive = planned) with circular
  waypoint markers at the junctions. Trail geometry lives on each segment's
  `path` in `src/data.ts`, and the lines recolor live when the assistant logs
  progress. Drawing custom overlays requires the JS API, which requires a key.
- **Without a key** — falls back to `src/components/PropertyMapEmbed.tsx`, the
  keyless Google embed: fully interactive (pan / zoom) with no account or billing,
  but no custom trail overlays. It's also the fallback if the JS API fails to load.

Either way the "Map ↗" pill deep-links to the location full-screen in Google
Maps. The original hand-drawn map is kept as `src/components/PropertyMap.tsx` if
you prefer the illustrated look.

### Plotting trails

The app ships with no trails. On the Trail Builder screen (with a Maps key),
**Plot a trail** puts the map in drawing mode: tap along the route to drop
points, name the trail, and save. The traced path and its measured length (see
`src/geo.ts`) are stored, drawn on the property map, and tracked from then on —
log build progress on it by name through the assistant.

### Property lines (GIS)

The Trail Builder screen can show the property boundary two ways (`src/parcel.ts`,
rendered by `PropertyMapLive`):

- **Import from VA GIS** — queries Virginia's statewide parcel FeatureServer
  (VGIN/VDEM) at the property center and draws the returned parcel polygon. The
  fetch runs in the browser; parcel boundaries are cartographic/approximate, not
  a survey, and the button falls back gracefully if the service is unreachable
  or blocks CORS.
- **Trace it** — tap each corner of the property on the map to draw the boundary
  by hand. Always available, accurate to what you know your lines to be.

The boundary is shaded on the property map (Home) and persists like everything
else. Set the property's real `lat`/`lng` in `src/data.ts` so both the map center
and the GIS lookup target the right land.

### Map overlays (toggles)

Below the Home map, two toggle chips control overlays on the live map:

- **Property lines** — shows/hides the boundary polygon (appears once a boundary
  is set).
- **Elevation** — overlays USGS contour lines from The National Map
  (`carto.nationalmap.gov`, added as a tiled `ImageMapType`). Loads as image
  tiles, so no CORS or key beyond the Google Maps key is needed.

### Persistence

Trails you plot, progress you log, and task/equipment changes are saved to the
browser's `localStorage` (`src/persist.ts`) so they survive reloads. There's no
backend; data lives on the device. Clearing site data resets to the empty seed.

## Deploy & install to your phone

This is a web app, so "installing" means adding it to your Home Screen — it gets
its own icon and opens full-screen (`display: standalone`), with no App Store
step. Icons and a web app manifest live in `public/`.

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the app and
publishes it to GitHub Pages on every push. One-time setup:

1. In the repo, **Settings → Pages → Build and deployment → Source: GitHub
   Actions**.
2. (Optional, for the trail overlays) **Settings → Secrets and variables →
   Actions → New repository secret** named `VITE_GOOGLE_MAPS_API_KEY` with your
   Maps key.
3. Push to the deploying branch — the site publishes at
   `https://<user>.github.io/trail-property-app/`.

On your iPhone, open that URL in Safari → **Share → Add to Home Screen**. The
production build is served from the `/trail-property-app/` base path (set in
`vite.config.ts`); if you rename the repo or host at the root, update `base`.

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check and build for production
npm run preview    # preview the production build
```

Fonts (Oswald + Spline Sans) load from Google Fonts; the app falls back to
system fonts if they are unavailable.
