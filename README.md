# 🐙 Wandro — the map collection game

**Lift the fog. Find the places most people walk past.**

Wandro is a photo-first, location-based exploration game and community app. It gives you the
"map reveal" feeling of open-world games, but the missions are real places: lesser-known museums,
castles, heritage sites, parks, viewpoints, beaches, music venues and nature spots. Places start
hidden under fog; physically visiting one unlocks it, clears the fog around it and earns points.
Hidden gems are worth the most.

- **Pilot region:** Sintra and its surroundings, Portugal
- **Status:** v1.0 — foundation, backend and app preview (Phases 0–2). See the [roadmap](#roadmap).
- **Try it in your browser:** <https://filippo-dimarzio.github.io/Wandro-Game-/> (demo mode,
  see [Hosting](#hosting-the-web-app))

---------------------------- | --------------------------- | -------------------------- | --------------------- |
| Hold to clear the fog | Feed-first, progress strip | Google Maps-style sheet | "Map of you", badges |

---

## Contents

- [The idea](#the-idea)
- [How it plays](#how-it-plays)
- [Look and feel](#look-and-feel)
- [Screens](#screens)
- [Scoring and progression](#scoring-and-progression)
- [Fair play, privacy and a civil community](#fair-play-privacy-and-a-civil-community)
- [Roadmap](#roadmap)
- [Run it yourself](#run-it-yourself)
- [Tech stack and repository layout](#tech-stack-and-repository-layout)
- [Developer commands](#developer-commands)
- [Hosting the web app](#hosting-the-web-app)
- [Releases](#releases)
- [Working together](#working-together)
- [Credits and licences](#credits-and-licences)

## The idea

Most travel apps send everyone to the same ten sights. Wandro rewards the opposite: **points scale
inversely with how often a place has been visited**, so a quiet convent in the forest is worth far
more than the most famous palace. Around the game sits a community layer: profiles, following
friends, a photo feed of discoveries, leaderboards and curated collections.

**Why "Wandro" and the octopus?** The name comes from "wander": short, easy to say in any language
and memorable. The octopus mascot reaches in eight directions at once, like an explorer. As you
level up, your octopus evolves (Hatchling → Explorer → Navigator → Cartographer).

## How it plays

1. **Explore the map.** Places near you are fogged and greyed out until you discover them.
2. **Go there for real.** When you're inside a place's geofence (75 m by default), the app offers
   _"You're at X — start discovery"_.
3. **Stay a moment.** A ring fills during the dwell time (2 minutes by default). The server checks
   your location, accuracy and timing; it never trusts the phone for points.
4. **Unlock it.** The fog clears in a circle around the place, you earn points, and you can add a
   photo.
5. **Daily challenge — touch to confirm.** Each day brings a new challenge (e.g. _"Step into
   history: discover any heritage site"_). It lasts a rolling 24 hours from when you first see it.
   After a matching discovery, **press and hold** to claim the bonus. Releasing early cancels, so
   it can't be claimed by accident; screen-reader users get a normal "activate" action instead.
6. **Collect.** Collections like _"Sintra's palaces"_ or _"Hidden gems"_ track progress and give a
   completion bonus.
7. **Suggest places.** Players can drop a pin and suggest a place. Moderators review it (public
   access, safe to visit) and **approve it as a new mission** on the map.

## Look and feel

- **Realistic, photo-first, not illustrated.** Real photos and real people, laid out like
  Instagram, with a Google/Apple Maps-style home for places and collections.
- **Fog of war.** Locked areas sit under a soft, muted fog; discovered places are in full colour.
  The fog never hides place names or pins (accessibility first).
- **Portrait only**, light and dark mode following the phone, clean neutral UI so photos carry the
  colour, one teal accent inspired by the octopus.
- **Warm, respectful tone** in all copy and community guidelines.
- **English first**, with every string in an i18n layer so Portuguese, Spanish, Italian and French
  can follow without refactoring.

## Screens

| Screen           | What it does                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entry portal** | Full-screen view under fog; hold to clear it and reveal Wandro.                                                                                               |
| **Registration** | Sign-up (email, Google, Apple), username, home city, then **pick your explorer style** (castles, nature, museums, music, beaches, hidden gems).               |
| **Home**         | Photo feed first, a slim progress strip (level, octopus stage, points), today's challenge, places near you.                                                   |
| **Explore**      | Map with locked/discovered places, category chips, legend, recenter button, and a bottom sheet with photo, category, distance, points, rarity and directions. |
| **Discover (+)** | Nearest place, "you're at X", hold to start discovery, dwell ring, success card.                                                                              |
| **Collections**  | Maps-style lists with cover, progress bar and completion bonus.                                                                                               |
| **Profile**      | "Map of you" (your cleared fog), discoveries, points, level, octopus stage and badges.                                                                        |

Navigation is a bottom tab bar like Instagram: Home · Explore · Discover · Collections · Profile.

## Scoring and progression

| Rule                  | Value                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| Base points           | Culture 100 · Heritage 120 · Nature 80 · Music & events 100 · Other 60                                        |
| Rarity multiplier     | `1 + 4 / (1 + n/10)`, where _n_ = unique visitors so far (0 → 5×, 10 → 3×, 100 → ~1.4×)                       |
| First discoverer      | +50 points                                                                                                    |
| Daily challenge       | +75 points, once per day, inside your 24 h window                                                             |
| Collection completion | +200 points                                                                                                   |
| Levels                | `level = floor(sqrt(xp / 100)) + 1`; streaks give XP only                                                     |
| Badges                | Category ("3 heritage sites"), region ("Sintra complete"), rarity ("Hidden gem hunter"), streak and community |

Points are frozen when awarded (an append-only ledger), so later changes in rarity never change
past scores. Each player can complete each place **once**.

## Fair play, privacy and a civil community

**The server decides everything that matters.** Points, unlocks, XP, badges and rarity are written
only by server functions. The database's row-level security stops the app from writing them
directly, and this is covered by automated tests.

**Location privacy (GDPR).**

- Location is used **only while the app is open** — never in the background.
- Only what's needed to verify a visit is stored; raw location pings are deleted once a visit is
  verified (24 hours at most).
- Nobody's live location is ever shown to anyone.
- Data export and account deletion are part of the plan. Minimum age: 16.

**Safety.** No challenges on private property or in dangerous spots — enforced in the database. Every
suggested place goes through moderation with a safety checklist.

**Civil community.** Reporting, blocking and moderation ship together with any user-generated
content. Photo metadata (EXIF/GPS) is stripped on upload. Nearby-place alerts are in-app only.

**Accessibility.** WCAG AA contrast, screen-reader labels, support for small screens and large text,
and alternatives to press-and-hold gestures.

## Roadmap

| Phase | Scope                                                                                                                                                                                                  | Status          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| 0     | Monorepo, tooling, CI, environment config                                                                                                                                                              | ✅ v1.0         |
| 1     | Database schema + security rules, auth, profiles, Sintra seed + importer                                                                                                                               | ✅ v1.0         |
| 2     | Map with fog, locked/unlocked places, filters, place details, app screens                                                                                                                              | ✅ v1.0         |
| —     | Daily challenge (touch to confirm) and approved missions (submission moderation)                                                                                                                       | ✅ v1.0 (early) |
| 3     | Server check-in validation, scoring, levels, streaks, badges                                                                                                                                           | ⏭ next (v2.0)   |
| 4a    | Photo posts, follows, feed, likes, report/block, guidelines                                                                                                                                            | Planned         |
| 4b    | Leaderboards, collections, place submissions UI, moderation                                                                                                                                            | Planned         |
| 5     | Onboarding polish, empty/error states, test coverage, store-ready builds                                                                                                                               | Planned         |
| Later | Comments, friend dares, food & beach challenges, Instagram share cards, events, teams, offline maps, more languages, region expansions (Lisbon coast, Alentejo, Algarve), subscription with fair perks | Ideas           |

The full plan — architecture, data model, check-in validation and every decision — is in
[`PLAN.md`](PLAN.md). Project rules for contributors (and Claude Code) are in
[`CLAUDE.md`](CLAUDE.md). Progress is tracked in [GitHub Issues](../../issues).

## Run it yourself

You need **Node 22+** and **pnpm 10** (`npm i -g pnpm`).

```bash
git clone https://github.com/Filippo-Dimarzio/Wandro-Game-.git wandro
cd wandro
pnpm install
```

**In your browser (fastest):**

```bash
pnpm web          # opens http://localhost:8081 (press w if it doesn't)
```

Use your browser's device toolbar (F12 → phone icon) for a phone-sized view.

**On your phone with Expo Go (no build needed):**

```bash
pnpm --filter mobile start
```

Scan the QR code with the **Expo Go** app. Expo Go can't load the Mapbox module, so the map shows a
simplified schematic view; everything else works.

**Full native build with the real Mapbox map:** needs a Mapbox account
(`EXPO_PUBLIC_MAPBOX_TOKEN` and `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` in `.env`) and Xcode/Android Studio
or an [EAS](https://expo.dev/eas) account:

```bash
cd apps/mobile && npx expo run:ios   # or: npx expo run:android
```

### Demo mode

Without Supabase credentials the app runs in **demo mode**: sample Sintra places, progress saved
on your device only.

- **Teleport here (demo)** in a place's sheet moves you there, so you can try a discovery from
  anywhere.
- Dwell time is shortened to 8 seconds (the real rule is 2 minutes, enforced by the server).
- **Profile → Reset demo progress** starts over.

To use a real backend, copy `.env.example` to `.env`, fill in `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY`, and apply `supabase/migrations` to your Supabase project.

### Things to try

1. Hold the button on the entry portal to clear the fog, then tap **Start exploring**.
2. Register: username, home city, explorer style.
3. **Explore:** filter by category, tap a place, tap the sheet handle to expand it.
4. Tap **Teleport here (demo)** on a heritage place, open **Discover**, hold **Start discovery** and
   wait for the ring. Back on **Explore**, the fog has cleared around it.
5. On **Home**, hold **Hold to confirm** on today's challenge to claim +75.
6. Check **Profile** for your level, octopus stage and badges.

## Tech stack and repository layout

- **App:** React Native + Expo (TypeScript, Expo Router), iOS, Android and web
- **Maps:** Mapbox (`@rnmapbox/maps`) on phones; MapLibre + OpenStreetMap tiles on the web
- **State:** TanStack Query (server data) + Zustand (on-device state)
- **Backend:** Supabase — Postgres + PostGIS, Auth, row-level security, Storage, Edge Functions
- **Place data:** OpenStreetMap (Overpass API) + Wikidata/Wikimedia Commons, imported idempotently
- **Quality:** Jest + React Native Testing Library, SQL tests for security rules and game logic,
  ESLint, Prettier, GitHub Actions

```
apps/mobile/        Expo app: screens (app/), components, map, data hooks, i18n
packages/shared/    scoring, levels, geo and fog helpers shared by app and server
supabase/           database migrations, seed data and SQL tests
scripts/importer/   OpenStreetMap + Wikidata place importer
.github/workflows/  CI, web deployment, releases
docs/releases/      release notes
```

## Developer commands

```bash
pnpm lint            # ESLint
pnpm format          # Prettier (format:check runs in CI)
pnpm typecheck       # TypeScript in every package
pnpm test            # unit and component tests
pnpm test:db         # SQL tests: schema, security rules, daily challenge, submissions
pnpm import:places   # OSM + Wikidata importer (add --dry-run to only print)
pnpm --filter mobile build:web   # static web build in apps/mobile/dist
```

`pnpm test:db` needs Postgres 16 with PostGIS on `localhost:5432` (user and password `postgres`):

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgis/postgis:16-3.4
```

**Continuous integration** (`.github/workflows/ci.yml`) runs lint, format check, typecheck, unit
tests and the database tests on every pull request and on `main`.

## Hosting the web app

`.github/workflows/deploy-web.yml` builds the web version (demo mode) and publishes it to
**GitHub Pages** on every push to `main`.

One-time setup by a repository admin: **Settings → Pages → Build and deployment → Source: GitHub
Actions**. The app is then live at `https://filippo-dimarzio.github.io/<repository-name>/`. Add
that link to the repository's **About → Website** field.

## Releases

Pushing a tag such as `v1.0.0` runs `.github/workflows/release.yml`, which publishes a GitHub
Release using the notes in `docs/releases/<tag>.md`. See [`CHANGELOG.md`](CHANGELOG.md).

## Working together

- Work on a branch per phase or feature (`phase-3-checkin-scoring`, `feature/…`) and open a pull
  request; CI must be green before merging.
- Read [`CLAUDE.md`](CLAUDE.md) first — it holds the rules both people and Claude Code follow
  (server-side scoring, location privacy, safety, accessibility, no hard-coded strings).
- Never commit secrets: use `.env` (git-ignored) and keep `.env.example` up to date.

## Credits and licences

- Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL).
- Place photos from Wikimedia Commons keep their original licence and attribution.
- Place descriptions enriched from Wikidata (CC0).
