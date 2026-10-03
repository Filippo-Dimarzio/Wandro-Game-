# Wandro — PLAN.md

Status: **DRAFT — awaiting approval. No code has been written.**

Wandro is a photo-first, community-driven exploration game. Players uncover real places (lesser-known museums, castles, heritage sites, parks, viewpoints, music venues, nature spots) by physically visiting them. Pilot region: **Sintra and surroundings, Portugal**. The mascot is an octopus (eight arms reaching out in every direction).

## 1. Product direction

- **Look and feel:** realistic, not illustrated. Real photos, real people, a clean Instagram-like layout, and a Google/Apple Maps-style home for places and collections.
- **Map:** a realistic Mapbox style (outdoors/satellite flavour). Locked places are desaturated with a muted fog overlay. Unlocked places are full colour. Fog must never reduce legibility (accessibility first).
- **Community-first and civil by design:** reporting, blocking, moderation and community guidelines ship with the first social feature, not later.

### Navigation (bottom tabs)

| Tab | Purpose |
|---|---|
| Home | Photo feed from followed players, "Today's challenge" card (later), search, notifications |
| Explore | Map with locked/unlocked places, category chips, Maps-style place sheet (photos, name, category, points, distance, directions) |
| Capture (+) | Start a check-in; optional proof photo |
| Collections | Maps-style lists with progress and a completion bonus; shareable |
| Profile | Photo grid of unlocks, level, badges, followers, mini-map of visited places |

## 2. Decisions and assumptions (change any of these)

| # | Topic | Default I will build to |
|---|---|---|
| 1 | Photos in MVP | **Yes.** Feed and photo posts are MVP (Phase 4a). Proof photo is optional and never required for points. |
| 2 | Place photos | Wikimedia Commons (licence + author + source URL stored for attribution), plus moderated user uploads. |
| 3 | Accounts | Assumed none exist yet. Dev runs locally (Supabase CLI + Docker). One hosted prod project; staging added only if needed. Mapbox, Apple Developer and Google Play accounts are needed by Phase 2 / Phase 5 — see section 11. |
| 4 | Repo | pnpm monorepo (see section 3). |
| 5 | Branching | One branch per phase (`phase-N-...`). I open a PR only when you ask. |
| 6 | Moderation tool | Supabase Studio plus SQL views for the MVP. A small in-app admin screen only if Studio proves too clumsy. |
| 7 | Location privacy | Raw location pings are kept only until a visit is verified (or 24 h at most), then deleted. Only the verified summary is kept. |
| 8 | Rarity / streaks | Rarity by all-time unique visitors (formula in section 6). Streak is daily and gives XP only, never points. |
| 9 | Minimum age | 16+ (conservative GDPR choice; confirm before launch). |
| 10 | Languages | English first; every string goes through i18n from day one so PT/ES/IT/FR can be added without refactoring. |

## 3. Architecture

```
wandro/
├── apps/mobile/          Expo (React Native, TypeScript, Expo Router)
├── supabase/
│   ├── migrations/       SQL schema, RLS, functions, views
│   ├── functions/        Edge Functions (check-in, scoring, account export/delete)
│   ├── seed/             Seed data
│   └── tests/            pgTAP/SQL tests for RLS and scoring
├── scripts/importer/     Overpass + Wikidata/Wikipedia/Commons importer
├── packages/shared/      Types, scoring constants, geo helpers (used by app + functions)
├── .github/workflows/    CI
├── PLAN.md  CLAUDE.md  .env.example
```

- **Client:** Expo Router, TanStack Query (server state), Zustand (UI/session state), `@rnmapbox/maps`, `expo-location` (foreground only), `expo-notifications`, `expo-image` for fast photo rendering.
- **Backend:** Supabase Postgres + PostGIS, Auth (email, Google, Apple), Row Level Security, Storage, Edge Functions (Deno).
- **Trust boundary:** the client is never trusted. All points, unlocks, XP and badges are written only by Edge Functions using the service role. Clients cannot insert or update `visits`, `points_ledger`, `user_badges` or `place_stats`.
- **Expo + Mapbox:** `@rnmapbox/maps` needs a development build (not Expo Go). EAS Build is set up in Phase 0.

## 4. Data model

All tables have `id uuid pk`, `created_at`, and RLS enabled. Key columns only:

**Identity & social**
- `profiles` — user_id (fk auth.users), username (unique, citext), display_name, avatar_url, home_city, is_private, level, xp, streak_days, last_active_date, locale, deleted_at.
- `follows` — follower_id, followee_id, status (`accepted` | `pending`), unique pair. Private profiles use pending requests.
- `blocks` — blocker_id, blocked_id. Blocks hide content both ways and prevent follows.
- `reports` — reporter_id, target_type (`profile`|`post`|`place_submission`|`photo`), target_id, reason, status, reviewed_by.

**Places**
- `regions` — slug, name, bbox/polygon, is_active (basis for later "expansions").
- `places` — name, description (i18n jsonb), location `geography(Point)`, category (`culture`|`heritage`|`nature`|`music_events`|`other`), geofence_radius_m (default 75), dwell_seconds (default 120), base_points, source, source_id (unique pair), wikidata_id, region_id, status (`draft`|`active`|`hidden`|`closed`), safety_notes, is_private_property (must be false to be active).
- `place_photos` — place_id, storage_path or external_url, author, license, source_url, status, is_primary.
- `place_stats` — place_id, unique_visitors (maintained only by the check-in function).

**Gameplay**
- `checkin_sessions` — user_id, place_id, started_at (server clock), status, expires_at.
- `checkin_pings` — session_id, lat, lng, accuracy, is_mocked, recorded_at. Ephemeral: deleted on completion, plus a scheduled cleanup after 24 h.
- `visits` — user_id, place_id, verified_at, lat, lng, accuracy, dwell_seconds, flags, **unique (user_id, place_id)**.
- `points_ledger` — user_id, visit_id/collection_id/badge_id, kind, points, xp, breakdown jsonb. An append-only audit trail; profile totals are derived from it.
- `badges`, `user_badges` — badge rules are data (criteria jsonb) evaluated server-side.
- `collections`, `collection_places` — curated sets with `completion_bonus_points`.
- `user_collection_progress` — derived view.

**Content**
- `posts` — user_id, visit_id (a post can only exist for a verified visit), caption, photo path(s), visibility, status. Photos have EXIF/GPS stripped on upload.
- `place_submissions` — user_id, name, location, category, description, photo, status (`pending`|`approved`|`rejected`), reviewer_id, reject_reason, safety checklist.
- `push_tokens`, `notifications`.

**Later (design hooks, not built):** `likes`, `comments`, `daily_challenges`, `events`, `teams`, `venue_partners`, `place_translations`.

**Leaderboards:** SQL views / materialized views, refreshed on a schedule. Scopes: friends, region, global, weekly. Private profiles are excluded from public boards.

## 5. Check-in validation (server-side)

1. **Start:** the app calls `start_checkin(place_id)`. The server creates a session with its own start timestamp. The client must be within the geofence (plus accuracy tolerance) to start.
2. **During dwell:** the app sends batched location pings (foreground only) while the user is at the place.
3. **Complete:** the app calls `complete_checkin(session_id)`. The server checks:
   - Elapsed server time since start ≥ place dwell time (default 120 s). Client clocks are ignored.
   - Enough pings within the geofence across the dwell window; reported accuracy ≤ 50 m (configurable).
   - Plausibility: no impossible jumps, speed within limits, no travel faster than a sensible maximum between the user's last two visits.
   - Mock flag: Android `mocked` and iOS software-simulated source info (where the OS exposes it). If flagged, the visit is held for review and gives no points. No automatic ban.
   - Rate limits: at most N check-ins per hour and per day per user.
   - Place is `active`, and the user has no existing visit there (also enforced by the unique constraint).
4. **On success** (one DB transaction): insert the visit, update `place_stats`, write ledger rows, update XP, level, streak and badges, delete the raw pings, return the result to the app.
5. **Idempotent:** retrying a completed session returns the same result and never double-awards.

Honest limits: GPS can always be spoofed by a determined user, especially on rooted or jailbroken devices. The goal is to make cheating inconvenient and detectable, and to keep cheaters off public leaderboards (flagged accounts are reviewable).

## 6. Scoring

- `points = round(base_points × rarity_multiplier)`; base points by category (tunable in a config table).
- `rarity_multiplier = 1 + 4 / (1 + n / 10)` where n = unique visitors so far. So n=0 → 5.0×, n=10 → 3.0×, n=100 → ≈1.4×, n=1000 → ≈1.04×.
- Points are frozen at award time in the ledger (a later change in rarity never alters earlier awards).
- First discoverer: a flat bonus plus a "First discoverer" mark on the place.
- Collection completion: bonus points, awarded once.
- XP levels: `level = floor(sqrt(xp / 100)) + 1`. Streaks (daily) add XP only.
- Concurrency: `place_stats` is updated under a row lock inside the check-in transaction, so two simultaneous check-ins cannot both be "first".
- All constants live in `packages/shared` and a config table, with unit tests.

## 7. Civil community & safety

- Community guidelines and terms accepted at sign-up. Report on every post, photo and profile; block and mute; private profiles with follow requests.
- Moderation queue for submissions, reported content and flagged visits. Reports are triaged in Studio at first.
- Apple's App Store rules for user-generated content require reporting, blocking and a way to remove abusive content, so these are built before store submission.
- Photos: EXIF stripped, size limits, optional automated image screening later. No face tagging; people must be able to remove any post about them.
- Place safety: no private property, no dangerous spots (cliff edges, closed sites). Every submission gets a safety checklist. Places can be hidden or closed instantly.
- Daily challenges (later) reward taking part within the day and never speed, to avoid rushing or risky behaviour.
- Gentle default copy (e.g. "Respect the place and the people around you").

## 8. Privacy / GDPR

- Location requested only while the app is in use (no background location).
- Only the verified visit summary is stored; raw pings are deleted (section 5).
- Nobody's live location is ever exposed. Feeds show "visited X" after the fact, with an option to hide the exact time.
- **Data export** and **account deletion** are Edge Functions: deletion removes profile, visits, posts and photos, and anonymises content that must remain.
- Data minimisation: no analytics SDK in the MVP; add one later with consent.
- Place photos from Wikimedia Commons keep their licence and attribution. OpenStreetMap data requires ODbL attribution in the app.

## 9. Place data import

`scripts/importer` is idempotent (safe to re-run):
1. Query Overpass for the Sintra bounding box (tourism=museum, historic=*, leisure=park, tourism=viewpoint, natural features, music venues, etc.).
2. Enrich with Wikidata/Wikipedia (descriptions, images via Commons).
3. De-duplicate by `(source, source_id)` and by name plus proximity.
4. Upsert into `places` as `draft`. A curator reviews and activates them (the safety and private-property check happens here).
5. Be polite to Overpass (one query, caching, backoff).

## 10. Phased roadmap

Each phase ends with: tests + lint green, a summary of changes, a manual test list, a commit, then **stop for your review**.

**Phase 0 — Foundation:** monorepo, TypeScript strict, ESLint, Prettier, Jest, GitHub Actions CI, `.env.example`, Expo app skeleton with a development build configured for EAS, i18n scaffold, CLAUDE.md in place. *Manual check:* app boots on a device or simulator; CI is green.

**Phase 1 — Data & auth:** schema and migrations, RLS policies with tests, Supabase Auth (email, Google, Apple), profile creation/editing (username, avatar, home city, privacy), Sintra importer and seed. *Manual check:* sign up, edit profile, inspect imported places.

**Phase 2 — Map:** Mapbox map with fog styling, user location (foreground), nearby places, locked/unlocked styling, category filters, place sheet. *Manual check:* map performance, contrast, small-screen layout, screen-reader labels.

**Phase 3 — Check-in & scoring:** Edge Functions (`start_checkin`, `complete_checkin`), scoring, levels, streaks, badges, integration tests for scoring/validation/RLS. *Manual check:* real-world walk to a Sintra place; negative tests (too far, too short, mock location).

**Phase 4a — Photos, feed & safety:** posts with optional proof photo, follow/unfollow (with private-profile requests), home feed, report/block, guidelines. *Manual check:* two test accounts following each other; report and block flows.

**Phase 4b — Leaderboards, collections, submissions:** leaderboards (friends/region/global/weekly), collections with completion bonus, place submissions, moderation queue. *Manual check:* collection completion; submission approved in Studio shows on the map.

**Phase 5 — Polish & release:** onboarding, empty/error/offline states, accessibility pass, test coverage, privacy policy and data export/delete flows verified, store-ready EAS builds. *Manual check:* full end-to-end on iOS and Android.

## 11. Things I need from you, and when

| By | What |
|---|---|
| Phase 1 | Supabase project (or confirm local-only for now); Google OAuth and Apple sign-in config |
| Phase 2 | Mapbox account with a public token and a secret download token |
| Phase 5 | Apple Developer and Google Play accounts; privacy policy and terms (I can draft; a lawyer should review) |
| Before launch | Trademark and app-store name check for "Wandro" |

## 12. Risks

- **UGC moderation workload** grows with photos; plan for a reporting SLA and a small moderation team.
- **Mapbox costs** scale with map loads; set billing alerts early.
- **Spoofing** can't be fully eliminated (section 5).
- **Place photo licensing**: only use photos with a clear licence; keep attribution.
- **Scope**: the brief plus a feed is already large; daily challenges, food challenges, selfie sharing, friend dares and regional expansions are deliberately post-MVP.

## 13. Later (designed for, not built)

Likes/comments, daily 5 pm local-time challenge, friend dares, food and beach challenges (venue QR codes for proof), Instagram sharing via the share sheet with a branded frame, time-limited events, team challenges, offline map caching, full i18n (PT, EN, ES, IT, FR), venue partnerships, region expansions (Lisbon coast, Alentejo, Algarve…).
