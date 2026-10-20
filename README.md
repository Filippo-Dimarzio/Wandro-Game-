# Wandro

Wandro is a location-based exploration game. The map starts under fog; you clear it by physically
visiting places, and the less visited a place is, the more it pays. Underneath, it is an Expo /
React Native app on a Supabase (Postgres + PostGIS) backend, where every reward is computed and
written server-side.

- **Play the demo:** <https://filippo-dimarzio.github.io/Wandro-Game-/> (web build, demo mode,
  installable as a PWA)
- **Beta waitlist:** <https://filippo-dimarzio.github.io/Wandro-Game-/join>
- **Desktop builds:** Windows, macOS and Linux installers on the
  [latest release](https://github.com/Filippo-Dimarzio/Wandro-Game-/releases/latest)

Launch regions are all in Portugal: **Sintra** (the pilot), **Lisbon**, **Porto**, **Évora**,
**Aveiro** and the **Algarve**, 279 seeded places in total. Other European cities are paused until
retention justifies them; that data lives on the `archive/europe-v3` branch.

## Contents

- [Game mechanics](#game-mechanics)
- [Scoring](#scoring)
- [Place content](#place-content)
- [Architecture](#architecture)
- [Check-in verification](#check-in-verification)
- [Privacy and safety](#privacy-and-safety)
- [Repository layout](#repository-layout)
- [Running it](#running-it)
- [Commands](#commands)
- [CI, deployment and releases](#ci-deployment-and-releases)
- [Contributing](#contributing)
- [Credits and licences](#credits-and-licences)

## Game mechanics

**Map and fog.** Undiscovered places are greyed out under a fog layer that never covers pins or
labels. Discovering a place clears a radius around it. On the web the map is MapLibre GL over
restyled OpenStreetMap raster tiles; native builds use `@rnmapbox/maps`.

**Challenge cards.** Tapping a place you haven't done opens a stamp card first: the place as a
postage stamp, its reward, a teaser and something to look for. _Let's go!_ starts map guidance.

**Place cards.** The full sheet has three tabs: _About_ (description, hours, photo
credit), _Learn_ (teaser, facts, something to look for) and _Plan_ (time needed, cost, access,
safety tips, a nearby place to pair it with). Cards with facts open straight on _Learn_.

**Getting there.** _Guide me_ shows distance, walking time and a hot/cold status. _Directions_ opens
Google Maps with a mode chosen by distance: walking up to 3 km, Google's default up to 50 km, a place
search beyond that. Location is requested with an in-app explainer first; once granted, the
explorer marker follows the device's foreground position.

**Checking in.** Inside a place's geofence you hold to check in. Verification is instant (no dwell
timer) and happens entirely on the server; see [Check-in verification](#check-in-verification).
An optional photo (camera, live photo with a selfie inset, camera roll or file) is attached and
posted to the day's _moments_.

**Categories.** Seven: Beaches & coast, Nature, Heritage, Culture, Art & museums, Music & events,
Curiosities. Each has a category page with an overview, a grid of its places and a Learn tab.

**Hidden gems.** Some places are never sent to the client until you're within 200 m. The
_Adventures_ sidebar only hints at coarse distance bands. All of a city's gems unlock after five
discoveries there.

**Daily challenge.** One per day on a rotating calendar, plus dated ones (Santos Populares in June,
International Museum Day on 18 May, Car-Free Day on 22 September). A matching discovery pays its
coins a second time. Completing a challenge each day keeps a day streak running.

**Collections.** Each city has sets of five or six places and a vintage stamp that starts blurred
and sharpens as you play there. Sets pay a per-place bonus and a completion bonus.

**Social.** Follows, friends (who can see activity on private profiles), friend challenges with a
short note, likes, and a single Portugal leaderboard ranked by XP. Other
players' moments are visible for 24 hours; after that only the author sees them, in their passport.
Players can suggest places; moderators approve them through a safety checklist before they become
missions.

**Travel.** Moving between cities triggers an arrival animation: a flight between airport cities
(Lisbon, Porto, Faro), otherwise a train or coach. The server stores the last city, never
coordinates.

**Explorers and the Store.** Players pick one of eight explorers and dress them on the Customise
screen. The Store sells cosmetics and timed boosts for coins: the incense trail (a guide line to the
nearest undiscovered place, 30 min or 2 h), outfits, hats, a time-of-day key, gold stamp ink and a
friend beacon. Coins are earned only by playing; there is no way to buy them, and spending never
affects rank, which is XP-based.

## Scoring

All values live in `packages/shared/src/constants.ts` and are mirrored in SQL; sync tests fail if
the two drift.

| Rule              | Value                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Base coins        | Heritage 120 · Culture, Art, Music & events 100 · Coast, Nature 80 · Curiosities 60      |
| Rarity multiplier | `1 + 4 / (1 + n/10)`, _n_ = unique visitors so far (0 → 5×, 10 → 3×, 100 → ~1.36×)       |
| First discoverer  | +50 coins                                                                                |
| Daily challenge   | the qualifying discovery pays again (minimum 75), once per day                           |
| Sets              | +20 per place in a set, +50 on completion                                                |
| XP and levels     | 50 XP per completed challenge; level 2 at 250 XP, each later level needs double the last |

Coins and XP go into an append-only `points_ledger`, so later changes to a place's rarity never
alter past rewards. A unique constraint on `(user_id, place_id)` in `visits` enforces one completion
per player per place.

## Place content

Places come from two sources: a hand-curated seed (the place and quest modules in `packages/shared/src`,
generated into `supabase/seed/seed.sql`) and an OpenStreetMap/Wikidata importer that writes new places as `draft`
for curator review. The importer upserts on `(source, source_id)`, so it is safe to re-run.

Learn content is stored as a `details` JSONB column (`PlaceDetails` in `packages/shared/src/types.ts`):
a teaser, one to three facts, and optional look-for, best time, duration, cost, access and tip
fields. Sintra, Lisbon, Porto and Évora are covered (195 places, about 450 facts); Aveiro and the
Algarve are not yet. Every fact keeps the URL it was checked against in a `source` field, which the
app does not display. Facts that came from research rather than a curator carry `needsReview: true`.
`details.test.ts` checks length limits, that each entry maps to a real place, and that the latest
migration re-applies exactly what the TypeScript source contains.

A place flagged as private property can never be active: the `active_not_private` check
constraint enforces it in the database. Unsafe spots are filtered out at moderation.

## Architecture

| Layer        | Choice                                                                                  |
| ------------ | --------------------------------------------------------------------------------------- |
| App          | Expo SDK 57, React Native, Expo Router, TypeScript strict; iOS, Android, web            |
| Desktop      | Electron shell around the static web build                                              |
| Maps         | `@rnmapbox/maps` on device; MapLibre GL + OSM raster tiles on web                       |
| Client state | TanStack Query for server state, Zustand (persisted) for session and UI state           |
| Backend      | Supabase: Postgres 16 + PostGIS, Auth, row-level security, Storage, Deno Edge Functions |
| Server logic | `SECURITY DEFINER` Postgres functions (RPCs) in `supabase/migrations`                   |
| Shared code  | `@wandro/shared`: scoring, levels, geo, fog, hours, catalogue, seed data                |
| Tests        | Jest + React Native Testing Library; SQL tests run against PostGIS                      |

**Server-authoritative writes.** Clients have no write access to `visits`, `points_ledger`,
`user_badges`, `place_stats`, `user_inventory`, `hidden_reveals`, `friendships`,
`friend_challenges`, `player_regions` or `city_stamps`. Every table has RLS enabled, and
`supabase/tests/rls.test.sql` asserts that a user can't read another's private data or write any
of those tables directly. RPCs validate input, are idempotent, and raise stable error codes
(`too_far`, `low_accuracy`, …) that the app maps to i18n strings.

**Edge Functions.** `check-photo` runs with the service-role key (which never ships in the app) and
removes blank uploads (black frames, flat colour), including a live photo's selfie.

**Demo mode.** Without Supabase env vars the app runs entirely on-device against the shared seed,
with `apps/mobile/src/demo` mirroring the server rules. The deployed web build is demo mode. Demo
logins live on the device that made them: the email plus a salted PBKDF2 hash of the password
(never the password itself), so logging out keeps the explorer for the next login.
Catalogue sync tests keep demo and SQL codes and prices identical.

**i18n.** No user-facing string is hard-coded; everything goes through `apps/mobile/src/i18n`.
English is the only locale shipped so far.

## Check-in verification

1. `start_checkin(place_id, lat, lng, accuracy, is_mock)` checks the fix is inside the geofence
   (75 m by default, plus up to 25 m of accuracy slack) and that accuracy is ≤ 50 m.
2. The client sends pings every 5 s while the sheet is open.
3. `complete_checkin(session_id)` verifies immediately if the latest fix is still inside. Mocked
   locations, jumps faster than 50 m/s and impossible travel since the previous visit are held for
   a moderator instead of paying out.
4. On success it writes the visit, ledger entries, badge awards and stats in one transaction, then
   deletes the session's raw pings.

`supabase/tests/checkins.test.sql` covers too-far, walked-away, low accuracy, mock flag, impossible
speed, replay and concurrent first-discoverer.

## Privacy and safety

- Foreground location only. Raw pings are deleted once a visit is verified (24 h at most), and no
  player's live location is ever exposed to another.
- Hidden gem coordinates are not sent until revealed. Arrival flights store the city only.
- EXIF and GPS metadata are stripped before upload.
- Report, block and moderation ship with every user-generated surface.
- Data export and account deletion are built in. Minimum age is 16.
- Accessibility target is WCAG AA: screen-reader labels on interactive elements, dynamic type,
  small-screen layouts and alternatives to press-and-hold.

## Repository layout

```
apps/mobile/          Expo app: routes in app/, components, map, data hooks, demo, i18n
apps/desktop/         Electron wrapper around the web build
packages/shared/      scoring, geo, fog, catalogue, seed places and place details
supabase/migrations/  forward-only migrations, YYYYMMDDHHMMSS_description.sql
supabase/functions/   Deno Edge Functions (check-photo)
supabase/seed/        generated dev seed
supabase/tests/       SQL tests (RLS, check-ins, scoring, social, shop, …)
scripts/importer/     OSM Overpass + Wikidata importer
docs/                 release notes, waitlist setup
.github/workflows/    CI, web deploy, PR screenshots, releases
```

[`PLAN.md`](PLAN.md) has the data model and design decisions. [`CLAUDE.md`](CLAUDE.md) holds the
project rules for contributors. [`CHANGELOG.md`](CHANGELOG.md) tracks what has shipped.

## Running it

Requires Node 22+ and pnpm 10.

```bash
git clone https://github.com/Filippo-Dimarzio/Wandro-Game-.git wandro
cd wandro
pnpm install
pnpm web                       # Expo web on http://localhost:8081, demo mode
```

**Expo Go:** `pnpm --filter mobile start` and scan the QR code. Expo Go can't load the Mapbox
native module, so the map falls back to a schematic view.

**Native build with Mapbox:** set `EXPO_PUBLIC_MAPBOX_TOKEN` and `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` in
`.env`, then `cd apps/mobile && npx expo run:ios` (or `run:android`), or build with EAS.

**Real backend:** copy `.env.example` to `.env`, set `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY`, and apply `supabase/migrations` to the project. Never put the
service-role key or the Mapbox secret token in the app's environment.

**Demo shortcuts:** _Teleport here_ on a place sheet moves you there, and the city picker in the
_Adventures_ sidebar switches region. Demo friends accept requests instantly.

## Commands

```bash
pnpm lint                              # ESLint
pnpm format                            # Prettier (CI runs format:check)
pnpm typecheck                         # tsc --noEmit in every workspace
pnpm test                              # Jest unit and component tests
pnpm test:db                           # SQL tests; needs Postgres 16 + PostGIS on localhost:5432
pnpm import:places [--dry-run]         # OSM/Wikidata importer
pnpm --filter @wandro/shared seed      # regenerate supabase/seed/seed.sql
pnpm --filter mobile build:web         # static web build into apps/mobile/dist
pnpm --filter desktop start            # build web, open in Electron
pnpm --filter desktop dist             # installer for the host OS
```

For `test:db`:

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgis/postgis:16-3.4
```

Run `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db` before pushing.

## CI, deployment and releases

- **CI** (`ci.yml`): lint, format check, typecheck, Jest and SQL tests on every PR and on `main`.
- **Deploy web app** (`deploy-web.yml`): builds the demo web app and publishes it to GitHub Pages
  on every push to `main`. `index.html` is copied to `404.html` so deep links such as
  `/explore?place=demo-pena` resolve.
- **PR preview**: screenshots every main screen and uploads them as the `app-screenshots` artifact.
- **Release**: pushing a `v*` tag publishes a GitHub Release from `docs/releases/<tag>.md` and
  attaches unsigned Windows (`.exe`), macOS (`.dmg`) and Linux (`.AppImage`) installers. Gatekeeper
  and SmartScreen will warn on first launch.

## Contributing

- Read [`CLAUDE.md`](CLAUDE.md) first. Its rules on server-side scoring, RLS, location privacy,
  safety and i18n are non-negotiable.
- Database changes go in a new migration; existing migrations are never edited.
- Shared constants belong in `packages/shared` with unit tests; demo mode has to stay in sync with
  the SQL.
- Secrets stay in `.env` (git-ignored); keep `.env.example` current.

## Credits and licences

- Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL.
- Place photos from Wikimedia Commons keep their original licence; author, licence and source URL
  are stored and shown with each photo.
- Place descriptions are partly derived from Wikidata (CC0).
