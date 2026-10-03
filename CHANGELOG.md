# Changelog

All notable changes to Wandro. Release notes live in [`docs/releases/`](docs/releases/).

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
