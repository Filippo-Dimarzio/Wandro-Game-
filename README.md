# Wandro — the map collection game

**Lift the fog. Find the places most people walk past.**

Wandro is a photo-first, location-based exploration game and community app. It gives you the
"map reveal" feeling of open-world games, but the missions are real places: lesser-known museums,
castles, galleries and street art, parks, viewpoints, beaches, music venues, historic stations,
trams and funiculars, and nature spots. Places start
hidden under fog; visiting one unlocks it, clears the fog around it and earns **coins** for your
explorer. Hidden gems are worth the most.

- **Where:** Portugal — Sintra (the pilot), Lisbon, Porto, Évora and Aveiro, each with at least
  five side quests in every category. We're focusing on Portugal until players prove they come
  back; the earlier European cities are kept on the `archive/europe-v3` branch (`archive/europe-v2` is an older snapshot)
- **Status:** v2.0 — the full game loop (Phases 0–8). See the [roadmap](#roadmap).
- **Play in your browser:** <https://filippo-dimarzio.github.io/Wandro-Game-/> (demo mode — click
  **Install app** to put it on your desktop)
- **Join the beta:** <https://filippo-dimarzio.github.io/Wandro-Game-/join>. Sign-ups go to a Google
  Sheet until the backend is live (setup: [`docs/waitlist`](docs/waitlist/README.md)).
- **See a pull request before it ships:** every PR runs the **PR preview** workflow, which
  screenshots each main screen (download **app-screenshots** from the run)
- **Download for desktop:** Windows, macOS and Linux installers on the
  [latest release](https://github.com/Filippo-Dimarzio/Wandro-Game-/releases/latest)

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

**Why "Wandro"?** The name comes from "wander": short, easy to say in any language and
memorable. The logo is a **W** drawn as a wandering route with a "you are here" dot. Each player
picks one of eight drawn **explorers** as their avatar, and as you level up your explorer's kit
grows: **Wanderer → Explorer** (a map) **→ Navigator** (a backpack) **→ Cartographer** (a camera).
**Wandro** himself is the brand's host, a wandering street musician who appears in marketing and at
key moments; the player is always the hero.

## How it plays

1. **Explore the map.** Places near you are fogged and greyed out until you discover them. Your
   explorer marks where you are, with a pulsing accuracy circle like _Find My_.
2. **Pick an adventure.** Tap a place and **Guide me**: a card shows the distance, walking time and
   how close you are (_On your way → Getting warmer → Almost there → You're here!_), with
   **Directions in Google Maps**. When a hidden gem is within 150 m, the app nudges you.
3. **Go there.** On a phone you walk there for real. In the browser or the desktop app (demo
   mode) you can walk your explorer with **WASD / arrow keys** (Shift = slow) or the on-screen pad.
4. **Stay a moment.** Hold **Start discovery** and stay inside the place's geofence (75 m) while
   the ring fills (2 minutes; 8 seconds in demo). The server checks location, accuracy, timing,
   mock locations and impossible speed — it never trusts the phone for coins.
5. **Unlock it.** The fog clears in a circle, coins land in your explorer's pouch, you may earn
   badges, and you can share a photo (its location data is stripped first).
6. **Daily challenge — double coins.** Each day brings a new challenge (e.g. _"Step into history:
   discover any heritage site"_), open for 24 hours from when you first see it. Every category
   gets a day, and set dates bring special ones (Santos Populares in June, Museum Day on 18 May,
   Car-Free Day on 22 September). After a matching discovery, **press and hold** to claim it: you
   get that discovery's coins **again**.
7. **Collect.** Collections like _"Sintra's palaces"_ pay a 200-coin bonus when complete.
8. **Spend coins in the Store.** The **incense trail** wraps your explorer in a glowing circle and
   draws a guiding line to your next adventure for 30 minutes or 2 hours. Outfits and hats
   are forever. Coins are only earned by playing — never bought — and spending never lowers your
   rank.
9. **Play together.** Follow explorers, like their discoveries, climb the leaderboards, and
   suggest new places, which moderators **approve as new missions**.
10. **Hunt hidden gems.** Every city hides secret places that aren't on the map at all. The
    **Adventures** sidebar hints how close the nearest one is (_under 500 m_, _within 1 km_…);
    walk within **200 m** and it appears on your map.
11. **Make friends.** Send friend requests (accepted friends can see each other's activity,
    even on private profiles) and **challenge a friend** to a place with a short idea —
    _"Go at golden hour!"_. It's ticked off when they discover it.
12. **Travel Portugal.** Land in a city served by another airport, open Wandro and a **flight
    animation** takes your explorer from your old airport to the new one (LIS ✈ OPO) before the
    map flies there. Sintra, Lisbon and Évora share Lisbon's airport, Aveiro shares Porto's, so
    moving between those needs no flight. In the browser demo, pick a city from
    **Explore → Adventures → city** to go there.

## Look and feel

- **Realistic, photo-first, not illustrated.** Real photos and real people, laid out like
  Instagram, with a Google/Apple Maps-style home for places and collections.
- **Fog of war.** Locked areas sit under a soft, muted fog; discovered places are in full colour.
  The fog never hides place names or pins (accessibility first).
- **Portrait only**, light and dark mode following the phone, clean neutral UI so photos carry the
  colour, one teal accent from the W logo.
- **Warm, respectful tone** in all copy and community guidelines.
- **English first**, with every string in an i18n layer so Portuguese, Spanish, Italian and French
  can follow without refactoring.

## Screens

| Screen           | What it does                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entry portal** | Full-screen view under fog; hold to clear it and reveal Wandro.                                                                                               |
| **Registration** | Sign-up (email, Google, Apple), username, home city, then **pick your explorer style** (castles, nature, museums, music, beaches, hidden gems).               |
| **Home**         | A slim progress strip (level, explorer rank, coins), interests, today's challenge, places near you.                                                           |
| **Explore**      | Map with locked/discovered places, category chips, legend, recenter button, and a bottom sheet with photo, category, distance, points, rarity and directions. |
| **Check in (+)** | Nearest place, hold to start discovery, dwell ring, reward card; below it today's moments (small boxes, unlocked by sharing your own, gone after 24 h).       |
| **Collections**  | One card per city that opens with an animation to show its sets of 5 places and your progress.                                                                |
| **Passport**     | Every moment you've shared, stamped by city. Only you see it.                                                                                                 |
| **Profile**      | "Map of you" (your cleared fog), discoveries, points, level, explorer rank and badges.                                                                        |

Navigation is a bottom tab bar like Instagram: Home · Explore · Check in · Collections · Profile.

## Scoring and progression

| Rule              | Value                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| Base coins        | Culture 100 · Heritage 120 · Nature 80 · Music & events 100 · Other 60                                        |
| Rarity multiplier | `1 + 4 / (1 + n/10)`, where _n_ = unique visitors so far (0 → 5×, 10 → 3×, 100 → ~1.4×)                       |
| First discoverer  | +50 coins                                                                                                     |
| Daily challenge   | Double coins: the qualifying discovery pays again (at least 75), once a day                                   |
| Sets              | +20 coins per place from a set, +50 for finishing the set                                                     |
| Levels            | `level = floor(sqrt(xp / 100)) + 1`; streaks give XP only                                                     |
| Badges            | Category ("3 heritage sites"), region ("Sintra complete"), rarity ("Hidden gem hunter"), streak and community |

Coins and XP are written to an append-only ledger, so later changes in rarity never change past
rewards. Each player can complete each place **once**. XP comes with every coin earned (plus
streaks and badges) and never goes down; leaderboards rank by coins **earned**, so shopping
doesn't cost you rank.

## The Store

| Item                            | Price     | What it does                                                                                                     |
| ------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| 🪔 Incense trail · 30 min / 2 h | 150 / 400 | Glowing circle around your explorer and a guiding line to the nearest undiscovered place; buying again adds time |
| 🧥 Outfits                      | 300–1200  | Your explorer's jacket colour on the map, profile and store                                                      |
| 🌺🧢🎩👑 Hats                   | 200–1500  | A hat for your explorer                                                                                          |

There is no subscription and no way to buy coins.

## Fair play, privacy and a civil community

**The server decides everything that matters.** Points, unlocks, XP, badges and rarity are written
only by server functions. The database's row-level security stops the app from writing them
directly, and this is covered by automated tests.

**Location privacy (GDPR).**

- Location is used **only while the app is open** — never in the background.
- Only what's needed to verify a visit is stored; raw location pings are deleted once a visit is
  verified (24 hours at most).
- Nobody's live location is ever shown to anyone.
- Data export and account deletion are built in. Minimum age: 16.
- Hidden gems are kept out of the app until you're within 200 m: the server never sends their
  location early, hints are coarse distance bands, and reveals are capped per day.
- For arrival flights the server remembers only the **city** you last opened the app in, never
  coordinates, and nobody else can see it.

**Safety.** No challenges on private property or in dangerous spots — enforced in the database. Every
suggested place goes through moderation with a safety checklist.

**Civil community.** Reporting, blocking and moderation ship together with any user-generated
content. Photo metadata (EXIF/GPS) is stripped on upload. Nearby-place alerts are in-app only.

**Accessibility.** WCAG AA contrast, screen-reader labels, support for small screens and large text,
and alternatives to press-and-hold gestures.

## Roadmap

| Phase | Scope                                                                                                                                              | Status          |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 0     | Monorepo, tooling, CI, environment config                                                                                                          | ✅ v1.0         |
| 1     | Database schema + security rules, auth, profiles, Sintra seed + importer                                                                           | ✅ v1.0         |
| 2     | Map with fog, locked/unlocked places, filters, place details, app screens                                                                          | ✅ v1.0         |
| —     | Daily challenge (touch to confirm) and approved missions (submission moderation)                                                                   | ✅ v1.0 (early) |
| 3     | Server-verified check-ins, coins, levels, streaks, badges                                                                                          | ✅ v2.0         |
| 4     | Photo posts, follows, feed, likes, report/block, leaderboards, collections, place submissions, moderation                                          | ✅ v2.0         |
| 5     | Settings, data export, account deletion, privacy page, onboarding guide, store-build config                                                        | ✅ v2.0         |
| 6     | Desktop app (Windows, macOS, Linux) and installable web app                                                                                        | ✅ v2.0         |
| 7     | Find-My-style walking: explorer marker, proximity guidance, Google Maps directions, keyboard walking                                               | ✅ v2.0         |
| 8     | Coin economy: double daily coins, Store with incense trail, skins and hats                                                                         | ✅ v2.0         |
| 9     | Europe (12 cities), hidden gems revealed at 200 m, friends and friend challenges, Adventures sidebar, arrival flights, log out, cleaner tab labels | ✅ Unreleased   |
| 10    | Portugal focus: Sintra, Lisbon, Porto, Évora, Aveiro; other cities paused; gems after 5 discoveries; landmark city cards; flights by airport       | ✅ Unreleased   |
| 10.1  | Culture themes (food, traditions, neighbourhoods); daily challenge calendar with dated challenges                                                  | ✅ Unreleased   |
| 15    | Explorers replace the octopus: eight drawn explorers to choose from, outfits, kit by rank (Wanderer → Cartographer), the W logo and app icons      | ✅ Unreleased   |
| Later | Comments, food challenges, Instagram share cards, events, teams, offline maps, more languages, more cities, push notifications for friend activity | Ideas           |

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

**Desktop app from source:**

```bash
pnpm --filter desktop start   # builds the web app, then opens the Electron window
pnpm --filter desktop dist    # builds an installer for your OS into apps/desktop/dist
```

**Full native build with the real Mapbox map:** needs a Mapbox account
(`EXPO_PUBLIC_MAPBOX_TOKEN` and `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` in `.env`) and Xcode/Android Studio
or an [EAS](https://expo.dev/eas) account:

```bash
cd apps/mobile && npx expo run:ios   # or: npx expo run:android
```

### Demo mode

Without Supabase credentials the app runs in **demo mode**: sample places in Sintra, Lisbon, Porto,
Évora and Aveiro, progress saved on your device only. The other players you see are fictional demo
explorers; real players appear once a Supabase project is connected.

- **Teleport here (demo)** in a place's sheet moves you there, so you can try a discovery from
  anywhere.
- Dwell time is shortened to 8 seconds (the real rule is 2 minutes, enforced by the server).
- **Explore → Adventures → city** moves your explorer to another city (a flight between Lisbon and Porto).
- Demo friends (ines.wanders, mia.maps…) answer requests straight away and have sent you challenges.
- **Profile → Log out** returns to the portal and, as there's no account in the demo, starts over.

To use a real backend, copy `.env.example` to `.env`, fill in `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY`, and apply `supabase/migrations` to your Supabase project.

### Things to try

1. Hold the button on the entry portal to clear the fog, then tap **Start exploring**.
2. Register: username, home city, explorer style.
3. **Explore:** filter by category, tap a place, tap the sheet handle to expand it.
4. Tap **Teleport here (demo)** on a heritage place, open **Discover**, hold **Start discovery** and
   wait for the ring. Back on **Explore**, the fog has cleared around it.
5. On **Home**, hold **Hold to confirm** on today's challenge to claim +75.
6. Check **Profile** for your level, explorer rank and badges; tap **Change your explorer** to pick another.
7. On **Explore**, open the **Adventures** sidebar (the compass tab on the left edge): accept
   ines.wanders's challenge, read the hidden-gem hint, then use **Walk** to head east from the
   town centre until the **Moorish Fountain** gem appears.
8. Tap the city button in the sidebar and pick **Porto** to watch the arrival flight (LIS ✈ OPO).
9. On **Home**, tap the people icon: accept sofia.sees's friend request and **Challenge** a friend.

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
apps/desktop/       Electron desktop app wrapping the web build
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
pnpm --filter desktop dist       # desktop installer for this OS
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

Pushing a tag such as `v2.0.0` (or running the **Release** workflow manually with the tag name) publishes a GitHub
Release using the notes in `docs/releases/<tag>.md`, then builds the Windows (`.exe`), macOS
(`.dmg`) and Linux (`.AppImage`) installers and attaches them. The installers are unsigned for
now, so Windows SmartScreen and macOS Gatekeeper will warn on first launch (macOS: right-click →
Open). See [`CHANGELOG.md`](CHANGELOG.md).

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
