# Changelog

All notable changes to Wandro. Release notes live in [`docs/releases/`](docs/releases/).

## [Unreleased]

### Added

- Beaches & coast category (database enum, importer mapping for beaches, bays and capes, demo and
  seed places, and a coastal daily challenge).
- Opening days and times for places that need them, shown on cards and the place sheet.
- Discover hub and colour-coded category pages with Overview, Places and Learn tabs.
- Illustrated category covers used for challenges, collections and places without a photo.
- Europe: 12 launch cities next to Sintra with curated places, a city picker on the map, city
  leaderboards that follow you, and `pnpm import:places --region <city>`.
- Hidden gems: secret places that appear on the map only within 200 m, with coarse hints.
- Friends: mutual friend requests and "challenge a friend" to a place with a short idea.
- Adventures sidebar on the map (slides out on phones, docked on desktop and tablets) with
  today's challenge, the hidden-gem hint, friends' challenges and nearby places.
- Arrival flights: opening the app in a new city plays a flight from your old airport.
- Log out button with confirmation on Profile and Settings, also in demo mode.

### Changed

- Brighter light-blue theme with Wandro blue as the accent and a colour per category.
- The check-in tab is now labelled "Check in" so "Discover" can name the new learning area.
- Tab labels have a proper line height and medium weight, so they no longer clip or run together.
- The friends leaderboard and private-profile access include accepted friends.

### Fixed

- `nearby_places` ignored its radius and returned every place (its `lat`/`lng` parameters were
  shadowed by the view's columns). With Europe seeded, a signed-in app would have loaded every
  city at once. Covered by a new test that unlocks places in Paris and Madrid.

## [2.0.0] — 2026-10-04

The full game loop (Phases 3–8). See [`docs/releases/v2.0.0.md`](docs/releases/v2.0.0.md).

### Added

- Server-verified check-ins (geofence, accuracy, dwell, mock/speed flags, rate limits), coins,
  XP, Lisbon-day streaks and badges (Phase 3).
- Follows with private-account requests, blocks, photo posts with EXIF stripped, likes, reports,
  feed, search, profile cards, leaderboards, server collections, place submissions UI and a
  moderation screen (Phase 4).
- Settings, data export, account deletion, privacy & guidelines page, How to play card, EAS
  config (Phase 5).
- Electron desktop app with installers on every release, installable web app (Phase 6).
- Find-My-style octopus marker, Guide me proximity card, Google Maps directions, nearby nudge,
  keyboard / on-screen walking in demo mode (Phase 7).
- Store with the incense trail, octopus skins and hats; animated coin counter (Phase 8).

### Changed

- The daily challenge now pays double coins (the qualifying discovery's coins again).
- "Points" are now called coins in the app; leaderboards rank by coins earned.
- No subscription: coins are earned only by playing.

### Fixed

- Infinite render loop on Home caused by an unstable store selector.

## [1.0.0] — 2026-10-03

Foundation, backend and app preview (roadmap Phases 0–2), plus an early daily challenge and
approved missions. See [`docs/releases/v1.0.0.md`](docs/releases/v1.0.0.md).

### Added

- Monorepo, tooling, CI, environment config (Phase 0).
- Database schema, row-level security, Sintra seed and OSM + Wikidata importer (Phase 1).
- App screens: entry portal, registration, home, explore map with fog, discovery, collections and
  profile (Phase 2).
- Daily challenge with press-and-hold confirmation, validated by the server.
- Place submissions with moderator approval into live missions.
- Web deployment to GitHub Pages and a tag-driven release workflow.

### Changed

- The repository previously hosted the FDM Space website, which has been replaced by Wandro. The
  old files remain in git history.
