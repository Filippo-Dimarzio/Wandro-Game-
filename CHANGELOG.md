# Changelog

All notable changes to Wandro. Release notes live in [`docs/releases/`](docs/releases/).

## [Unreleased]

### Added

- The app now speaks in Wandro's voice: warm, short and specific, with a little Portuguese
  ("Bora?", "Olha!", "Obrigado") at onboarding, discoveries, challenges, empty screens, hidden
  gems, errors and notifications. Buttons, settings and privacy text stay plain.
- The demo now invites people to the beta: a "Join the Lisbon & Sintra beta" link on the entry
  screen and a "Liking it so far?" card on Home, both opening `/join` (tagged `src=portal` and
  `src=demo`).

- A `/join` page for the beta waitlist, styled like the app: email, where you live, study or work,
  how you get around, what you'd explore first, Fog Walk interest and consent. Each link can carry
  `?src=` to tell channels apart. Sign-ups go to the `waitlist` table with a backend (insert-only;
  nobody can read it back through the API), or to a Google Sheet on the demo site
  (`docs/waitlist`).

- Explorers replace the octopus. Players pick one of eight drawn explorers at sign-up (and can
  change it from Profile); friends and profile pages show each player's explorer. Store skins are
  now outfits (jacket colours), and your explorer's kit grows with rank: Wanderer (new name for
  Hatchling), Explorer with a map, Navigator with a backpack, Cartographer with a camera. The
  explorer drawings are placeholders the illustrator can replace file for file.
- New W logo and app icons: a W drawn as a wandering route with a yellow "you are here" dot.
- XP and levels: every completed challenge (discovery or daily challenge) gives 50 XP; level 2
  needs 250 XP and each next level doubles the XP needed. Coins stay separate (spent in the store).
  The Home header explains the difference.
- Outfits (skins) have their own challenge (e.g. discover 3 coast spots) that must be completed
  before they can be bought; the server enforces it (`challenge_not_done`).
- Cities leaderboard: one board per city, ranked by challenges completed there.
- Dark mode button in the Home header and a Dark mode switch in Settings (no floating widget).
- "Your photo library" in Collections keeps every photo you posted; Moments still show a post for 24 h.
- Streets have an outline so they read at every zoom, and the walking character follows streets on
  the web map instead of crossing buildings.

- PR preview workflow: every pull request builds the web app and attaches screenshots of each
  main screen (`apps/mobile/scripts/screenshots.mjs`).
- Storybook map: the map now looks like a hand-painted city map, with peach ground, mint parks
  and gardens, periwinkle water with a coral shore, soft cream streets and only a few labels
  (avenues, water, neighbourhoods). Same look on web and phones, with a night palette in dark
  mode. Falls back to plain OpenStreetMap tiles if the map
  tiles can't load.

- Oddity of the day now has 23 different quests ("Look up!", "Local legend", "Water wonders",
  "Sweet secret"...), one per Curiosities day; any curiosity still counts.

- New hand-drawn cards for Beaches & coast, Culture (a blue azulejo street with market,
  festival and café) and a lighter Curiosities card. Art & museums gets its own violet card,
  and Culture's colour is now azulejo indigo to match its card; map pins re-rendered.

- New hand-drawn city stamp pictures: vintage engravings of Pena Palace, Belém Tower, the
  Dom Luís I Bridge, the Roman Temple of Évora and Aveiro's moliceiros
  (`assets/stamps/src`, rendered by `scripts/render-stamps.mjs`).

### Fixed

- Demo photos survive reloads, app updates and new deploys: the photo itself is saved (a compact
  JPEG) instead of a temporary link. Every photo from the last 24 h is always kept.

- Trips between cities: a flight only when both cities have their own airport (Lisbon ↔ Porto);
  otherwise the quicker of train or a green coach, with its own animation and travel time. Every
  move between launch cities is now an arrival (`20261014090000_trips`).
- A light/dark switch on the right edge of every screen (follows the phone until you choose).
- Game layer on the storybook map, after illustrated tourist maps: only a light mist over
  unexplored ground (no more hatching hiding places), bold category pins with a lock (to explore)
  or gold tick (discovered; tap a pin for its name), a big illustrated badge for each city's
  signature landmark, a compass rose, and leaves drifting across by day (fireflies at night).
- Map key: "To explore" and "Discovered" counts; tap it for what they mean.
- Collections city art redrawn as terracotta ink sketches of each city's landmark.
- City celebrations: a new city stamp slams onto the screen with fireworks, and claiming every
  place in a city's sets gets the bigger show.

- Three new boosts in the Store, all rewarded by the server:
  - **Time-of-day key** (24 h, 200 coins): golden-hour and night quests at 11 places across
    the five cities pay +40 coins when you discover them in their window; the place sheet shows
    the window and whether your key is ready.
  - **Gold stamp ink** (one use, 250 coins): the next new city you collect gets a gold postmark
    and frame on its stamp.
  - **Friend beacon** (one use, 150 coins): light it on a friend challenge; if it's finished the
    same day, you both get +50 coins.
- City stamps are now stored on the server (`city_stamps`) and included in the data export.

- City stamps: a perforated postage stamp with the city's landmark and a Wandro postmark for
  every city you've collected, on its Collections box, in the city sheet and on a "City stamps"
  page in your passport (empty dashed slots for cities still to collect).
- Blank photos are refused: the app rejects a black or empty photo when you pick it, the
  `check-photo` Edge Function re-checks every upload, other players only see photos that passed
  (`posts.photo_checked_at`), and moderators can sweep older photos and delete blank ones.
- Culture themes: Culture now covers food, markets and cafés; traditions and festivals; and
  neighbourhood life, with new Learn copy and 15 new places (one per theme in each city).
- Daily challenge calendar: "Sound check" and "Oddity of the day" join the rotation, so every
  category gets a day (9-day cycle). Dated challenges for a date or a date range, with twelve
  months scheduled (autumn and winter campaigns, São Martinho, Carnaval, Monuments and Sites Day,
  25 de Abril, Museum Day, Santos Populares, World Music Day, Car-Free Day, Heritage Days).

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
- Art (galleries, murals, street art) and Travel (stations, trams, funiculars, cable cars)
  categories, with colours, Discover pages, importer mapping and daily challenges.
- 130 more places: 10 per city (3 art, 2 culture, 3 nature, 2 travel).
- `pnpm --filter importer photos` finds a real, freely licensed photo for every place on
  Wikidata / Wikimedia Commons and records author, licence and source; the place sheet credits
  it and links to the source.
- Today's moments on the Check in tab: a grid of small boxes with what the people you follow and
  your friends shared in the last 24 h. They unlock once you share a photo of a discovery
  yourself, and disappear from everyone else's view after 24 h (enforced by RLS and the photo
  storage policy).
- Passport: every moment you've shared, stamped onto the page of its city. Only you can see it.
- City sets: two sets of 5 places in every launch city (its icons, and its 3 art + 2 travel
  places). Collections shows one card per city that opens with an animation.
- Eight more cities: Budapest, Dublin, Cork, Stockholm, Copenhagen, Warsaw, Gdańsk and the
  Basque Country (Bilbao to San Sebastián), each with a hidden gem and two sets.
- Side quests: every city now has at least five places in each category, about 650 new ones,
  written as a historian's brief with a task. Heritage favours quieter palaces, among them Queluz,
  Caxias, Fronteira and the Marquis of Pombal's palace in Oeiras for Lisbon, and Quinta do
  Relógio, Penha Verde and Chalet Biester in Sintra. Inland cities get river beaches and lakes for
  Beaches & coast.
- The dev seed's Europe block is generated from `packages/shared`
  (`pnpm --filter @wandro/shared seed`), and a test keeps them in step.
- Gold coin with a slot for the mascot artwork (`apps/mobile/src/coin.ts`).

- Évora and Aveiro, with five quests in every category and two hidden gems each.
- Hidden gems: discovering 5 places in a city reveals all of its gems at once (as well as one by
  one within 200 m). Every city has at least two.
- Collections: a box per city with a drawing of its landmark (Pena Palace, Belém Tower, Dom Luís I
  Bridge, the Roman Temple, Aveiro's moliceiros), greyed out until you discover a place there.
  Tapping a box zooms into the city: its sets and how close you are to its hidden gems.
- Map pins show each category's hand-drawn art, with a lock or check badge.
- Animated cards: they slide in and press down softly; Reduce Motion turns this off.

### Changed

- Hats now sit on the octopus's head.
- Removed the made-up demo posts from Moments and the "Act as a moderator" demo tool (teleport stays).
- Wandro is Portugal-only for now (Phase 10): Sintra, Lisbon, Porto, Évora and Aveiro. The other
  18 cities are switched off in the database (regions inactive, places closed, sets closed) and
  removed from the app's code, demo, dev seed and importer; the European content is kept on the
  `archive/europe-v3` branch (`archive/europe-v2` is an older snapshot). Players' visits, coins, posts and passport stay intact, and open
  friend challenges to paused places are declined (`pause_inactive_regions()`).
- Travel is folded into Culture; Art is now "Art & museums" with the culture illustration. The
  challenge rotation's travel day is a music & events day.
- Check in is a full-bleed card: the place's picture, a "You're here" or distance badge, and one
  clear next step. Screens keep a phone-width column on wide windows.
- Discover is a two-column grid. Arrival flights compare airports: Lisbon ↔ Porto (LIS ✈ OPO) is a
  flight, Sintra ↔ Lisbon ↔ Évora is not, and nothing counts from a paused city. Open friend
  challenges to paused places are declined.
- Plan: a business-plan section (Portugal first, phases, players, north-star metric).

- Brighter light-blue theme with Wandro blue as the accent and a colour per category.
- The check-in tab is now labelled "Check in" so "Discover" can name the new learning area.
- Tab labels have a proper line height and medium weight, so they no longer clip or run together.
- The friends leaderboard and private-profile access include accepted friends.
- Sets pay 20 coins for each place you find from them and 50 for finishing them (was 200 on
  completion only). The check-in reward shows the set coins.
- The "From explorers you follow" feed moved off Home.
- Lisbon's area reaches west to Carcavelos; Dublin's covers the bay to Howth; Cork's the harbour.
- Challenging a friend offers the 24 nearest places (was 12).
- "1 hidden gem nearby" instead of "1 hidden gems".
- Discover shows the categories as a simple photo grid; details open when you tap one.
- The daily challenge card shows a real place that fits the challenge instead of the octopus,
  and the hidden-gem card is a fog mystery instead of the octopus.

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
