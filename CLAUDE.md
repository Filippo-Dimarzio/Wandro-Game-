# CLAUDE.md — Wandro

Wandro is a photo-first, location-based exploration game and community app. Launch regions: Sintra (the pilot), Lisbon, Porto, Évora and Aveiro, Portugal (`REGIONS` in `packages/shared`); other cities are paused until players prove they come back. See `PLAN.md` for architecture, data model and roadmap. This file is the rulebook for working in the repo.

## How we work

- Build **one phase at a time** (see `PLAN.md`). At the end of each phase: run tests + lint, summarise changes, list what to test manually, commit with a clear message, then **STOP for review**.
- Prefer simple, boring solutions. Explain non-obvious decisions in 1–2 sentences.
- Do not start work outside the current phase. Ask when something is ambiguous.
- Ship every requested change to `main` (production): run `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`, merge into `main`, push, and confirm the CI and "Deploy web app" workflows pass so the change is live. Work on a branch first when it helps, but don't leave finished work off `main`. Do not open a PR unless asked.

## Stack

- App: React Native + Expo (TypeScript strict, Expo Router), iOS + Android. Needs a development build (Mapbox), not Expo Go.
- Maps: `@rnmapbox/maps`. Client state: TanStack Query (server state) + Zustand (UI state).
- Backend: Supabase (Postgres + PostGIS, Auth, RLS, Storage, Edge Functions in Deno).
- Tests: Jest + React Native Testing Library; SQL/pgTAP tests for RLS and scoring; integration tests for check-in validation.
- Tooling: pnpm workspaces, ESLint, Prettier, GitHub Actions, EAS Build.

## Repo layout

```
apps/mobile/       Expo app (iOS, Android, web)
apps/desktop/      Electron desktop app (wraps the web build)
supabase/          migrations, functions, seed, tests
scripts/importer/  OSM/Wikidata importer
packages/shared/   shared types, scoring constants, geo helpers
```

## Commands

```
pnpm install                     install dependencies
pnpm web                         run the app in the browser (demo mode without .env)
pnpm --filter mobile start       Expo dev server (Expo Go / dev build)
pnpm lint                        ESLint
pnpm format                      Prettier (check with pnpm format:check)
pnpm typecheck                   tsc --noEmit across workspaces
pnpm test                        Jest unit/component tests
pnpm test:db                     SQL/RLS/scoring tests (Postgres 16 + PostGIS on localhost)
pnpm import:places [--dry-run]   run the place importer (idempotent)
pnpm --filter @wandro/shared seed  regenerate the dev seed's launch-city places and city sets
pnpm --filter mobile build:web   static web build
pnpm --filter desktop start      run the desktop app (builds the web app first)
pnpm --filter desktop dist       build a desktop installer for this OS
```

Before reporting a phase done, run `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

## Non-negotiable rules

1. **Server decides everything that matters.** Points/coins, XP, levels, badges, unlocks, rarity and inventory are written only by `SECURITY DEFINER` server functions (Postgres RPCs in `supabase/migrations`). Never compute or accept points from the client. Clients have no write access to `visits`, `points_ledger`, `user_badges`, `place_stats`, `user_inventory`, `hidden_reveals`, `friendships`, `friend_challenges`, `player_regions` or `city_stamps`. Coins are never sold.
2. **One completion per user per place**, enforced by a unique constraint as well as in code.
3. **Every table has RLS enabled.** New tables ship with policies and RLS tests in the same migration PR.
4. **Never commit secrets.** Use `.env` (git-ignored); keep `.env.example` current. The Supabase service-role key and Mapbox secret token never go into the app bundle.
5. **Location privacy:** foreground location only. Store only what is needed to verify a visit. Raw pings are deleted after verification (max 24 h). Never expose anyone's live location; hidden gems' locations are only sent once revealed; arrival flights store the city, never coordinates; other people see a post for 24 h only, after which it is visible to its author alone. Maintain data export and account deletion.
6. **Safety:** no challenges on private property or in dangerous spots. Submissions are moderated before becoming places.
7. **Civil community:** report, block and moderation ship with any user-generated content. Strip EXIF/GPS from uploaded photos.
8. **Accessibility:** WCAG AA contrast, screen-reader labels on interactive elements, support small screens and dynamic text sizes. Fog styling must never hide place legibility.
9. **No hard-coded user-facing strings.** Use the i18n layer (English first; PT/ES/IT/FR later).

## Conventions

- TypeScript `strict`; no `any` without a comment explaining why.
- Shared constants (scoring, radii, thresholds) live in `packages/shared`, with unit tests.
- Database changes only via migration files in `supabase/migrations`; never edit the hosted DB by hand. Migrations are forward-only and named `YYYYMMDDHHMMSS_description.sql`.
- Server functions validate input, are idempotent, raise stable error codes (e.g. `too_far`) that the app maps to i18n strings, and ship with SQL tests.
- Demo mode mirrors server rules in `packages/shared` / `apps/mobile/src/demo`; keep both in sync (catalogue sync tests enforce codes and prices).
- Server state goes through TanStack Query; Zustand is for UI/session state only.
- Match existing code style; Prettier and ESLint are the authority. Keep comments for the "why", not the "what".
- Commits: imperative, clear messages. One logical change per commit.
- Branches: `phase-N-short-description`, one per phase.

## Data and attribution

- OpenStreetMap data is ODbL: show attribution in the app.
- Place photos from Wikimedia Commons: store licence, author and source URL, and show attribution.
- The importer must stay idempotent (upsert by `(source, source_id)`), polite to Overpass, and write new places as `draft` for curator review.

## Testing expectations

- Scoring: unit tests for the rarity formula, bonuses, streaks and levels.
- Check-in (instant, no dwell): integration tests for too-far, walked-away, low accuracy, mock flag, impossible speed, replay and concurrent first-discoverer.
- RLS: tests that a user cannot read private profiles' data, write another user's rows, or write server-only tables.
- UI: component tests for map-sheet, feed and forms using React Native Testing Library.
