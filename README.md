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

## Getting started

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check and build for production
npm run preview    # preview the production build
```

Fonts (Oswald + Spline Sans) load from Google Fonts; the app falls back to
system fonts if they are unavailable.
