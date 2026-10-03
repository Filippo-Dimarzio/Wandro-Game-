# Wandro

A photo-first exploration game: uncover real places around Sintra by visiting them.
See [`PLAN.md`](PLAN.md) for the product plan and [`CLAUDE.md`](CLAUDE.md) for project rules.

## Quick start: see the app

You need **Node 22+** and **pnpm 10** (`npm i -g pnpm`).

```bash
git clone https://github.com/Filippo-Dimarzio/FDM-Space-Website.git wandro
cd wandro
pnpm install
```

### 1. In your browser (fastest)

```bash
pnpm web
```

Press `w` if the browser doesn't open (http://localhost:8081). Use your browser's device toolbar
(F12 → phone icon) for a phone-sized view. The web map uses free OpenStreetMap tiles.

### 2. On your phone with Expo Go (no build needed)

```bash
pnpm --filter mobile start
```

Install **Expo Go** from the App Store / Play Store and scan the QR code. Expo Go can't load the
Mapbox module, so the map shows a simplified schematic view; everything else works.

### 3. Full native build with the real Mapbox map

Needs a Mapbox account (`EXPO_PUBLIC_MAPBOX_TOKEN` and `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` in `.env`) and
either Xcode/Android Studio or an [EAS](https://expo.dev/eas) account:

```bash
cd apps/mobile
npx expo run:ios        # or: npx expo run:android
```

## Demo mode vs. real backend

Without Supabase credentials the app runs in **demo mode**: places are bundled sample data and
progress is stored on the device. Demo extras:

- **Teleport here (demo)** in a place's sheet moves you there, so you can try a discovery from anywhere.
- The dwell time is shortened to 8 s (the real rule is 2 min, enforced by the server).
- **Profile → Reset demo progress** starts over.

To use a real backend, copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY`, then apply `supabase/migrations` to your project.

## Try these flows

1. **Entry portal:** hold the button to clear the fog, then tap **Start exploring**.
2. **Registration:** pick a username, home city and explorer style.
3. **Explore:** filter by category, tap a place to open its sheet, tap the handle to expand it.
4. **Discover:** teleport to a place, open **Discover**, hold **Start discovery**, wait for the ring.
   The fog clears around the place on the map.
5. **Daily challenge (touch to confirm):** after a matching discovery, hold **Hold to confirm** on Home
   to claim the bonus. It can only be claimed once, and only inside your 24 h window.

## Developer commands

```bash
pnpm lint           # ESLint
pnpm format         # Prettier (format:check in CI)
pnpm typecheck      # TypeScript in every package
pnpm test           # Jest: shared scoring/geo, importer, app components
pnpm test:db        # SQL tests for schema, RLS, daily challenges and submissions
pnpm import:places  # OSM + Wikidata importer (add --dry-run to only print)
pnpm --filter mobile build:web   # static web build in apps/mobile/dist
```

`pnpm test:db` needs Postgres 16 with PostGIS on `localhost:5432` (user/password `postgres`), e.g.:

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgis/postgis:16-3.4
```

## Repository layout

```
apps/mobile/       Expo app (Expo Router, TanStack Query, Zustand, Mapbox / MapLibre web)
packages/shared/   scoring, levels, geo and fog helpers shared by app and server
supabase/          migrations, seed, SQL tests
scripts/importer/  OpenStreetMap + Wikidata place importer
```

Map data © OpenStreetMap contributors (ODbL).
