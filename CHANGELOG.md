# Changelog

All notable changes to Wandro. Release notes live in [`docs/releases/`](docs/releases/).

## [Unreleased]

### Added

- Beaches & coast category (database enum, importer mapping for beaches, bays and capes, demo and
  seed places, and a coastal daily challenge).
- Opening days and times for places that need them, shown on cards and the place sheet.
- Discover hub and colour-coded category pages with Overview, Places and Learn tabs.
- Illustrated category covers used for challenges, collections and places without a photo.

### Changed

- Brighter light-blue theme with Wandro blue as the accent and a colour per category.
- The check-in tab is now labelled "Check in" so "Discover" can name the new learning area.

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
