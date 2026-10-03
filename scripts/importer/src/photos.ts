/**
 * Finds a real, freely licensed photo for every curated place and records its attribution.
 *   pnpm --filter importer photos            -> writes packages/shared/src/place-photos.ts and the
 *                                              photo block in supabase/seed/seed.sql
 *   pnpm --filter importer photos --dry-run  -> prints the report only
 *
 * For each place: search Wikidata by name, keep the candidate whose coordinates (P625) are
 * closest and within 1.5 km, take its main image (P18) and read author and licence from
 * Wikimedia Commons. Places whose Wikidata coordinates are more than 150 m from ours are listed
 * so their pins can be checked. Requests are sequential and identify the app (Wikimedia policy).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEMO_PLACES, haversineMeters, regionBySlug, type Place } from '@wandro/shared';
import {
  pickCandidate,
  photoSeedSql,
  photosModule,
  stripHtml,
  type Candidate,
  type FoundPhoto,
} from './photos-lib';

const UA = 'WandroPhotoBot/1.0 (https://github.com/Filippo-Dimarzio/Wandro-Game-)';
const ROOT = resolve(__dirname, '../../..');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string): Promise<unknown> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (res.ok) return res.json();
    if (res.status !== 429 && res.status < 500) throw new Error(`${res.status} ${url}`);
    await sleep(2000 * 2 ** attempt);
  }
  throw new Error(`gave up on ${url}`);
}

async function candidates(place: Place): Promise<Candidate[]> {
  const region = place.region ? regionBySlug(place.region) : undefined;
  const queries = [place.name, region ? `${place.name} ${region.name}` : null].filter(Boolean);
  const ids = new Set<string>();
  for (const q of queries) {
    const search = (await getJson(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=7&search=${encodeURIComponent(q!)}`,
    )) as { search: { id: string }[] };
    search.search.forEach((s) => ids.add(s.id));
    await sleep(150);
  }
  if (ids.size === 0) return [];
  const entities = (await getJson(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${[...ids].join('|')}`,
  )) as {
    entities: Record<
      string,
      {
        claims?: Record<string, { mainsnak: { datavalue?: { value: unknown } } }[]>;
      }
    >;
  };
  return Object.entries(entities.entities).flatMap(([qid, e]) => {
    const coord = e.claims?.P625?.[0]?.mainsnak.datavalue?.value as
      { latitude: number; longitude: number } | undefined;
    const image = e.claims?.P18?.[0]?.mainsnak.datavalue?.value as string | undefined;
    return coord && image ? [{ qid, lat: coord.latitude, lng: coord.longitude, image }] : [];
  });
}

async function commonsInfo(file: string): Promise<FoundPhoto | null> {
  const data = (await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1024&titles=${encodeURIComponent(`File:${file}`)}`,
  )) as {
    query: {
      pages: Record<
        string,
        {
          imageinfo?: {
            thumburl?: string;
            descriptionurl: string;
            extmetadata: Record<string, { value: string } | undefined>;
          }[];
        }
      >;
    };
  };
  const info = Object.values(data.query.pages)[0]?.imageinfo?.[0];
  const license = info?.extmetadata.LicenseShortName?.value;
  if (!info?.thumburl || !license) return null;
  return {
    url: info.thumburl,
    author: stripHtml(info.extmetadata.Artist?.value ?? 'Unknown author').slice(0, 120),
    license,
    source: info.descriptionurl,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const found: Record<string, FoundPhoto> = {};
  const missing: string[] = [];
  const moved: string[] = [];

  for (const place of DEMO_PLACES) {
    try {
      const pick = pickCandidate(place, await candidates(place));
      if (!pick) {
        missing.push(place.id);
        continue;
      }
      const distance = haversineMeters(place, pick);
      if (distance > 150)
        moved.push(`${place.id}: Wikidata ${pick.qid} is ${Math.round(distance)} m away`);
      const photo = await commonsInfo(pick.image);
      if (photo) found[place.id] = photo;
      else missing.push(place.id);
      await sleep(150);
    } catch (e) {
      missing.push(`${place.id} (${(e as Error).message})`);
    }
  }

  console.error(`Photos: ${Object.keys(found).length}/${DEMO_PLACES.length}`);
  if (missing.length) console.error(`No photo:\n  ${missing.join('\n  ')}`);
  if (moved.length) console.error(`Check these pins:\n  ${moved.join('\n  ')}`);
  if (dryRun) return;

  writeFileSync(resolve(ROOT, 'packages/shared/src/place-photos.ts'), photosModule(found));
  const seedPath = resolve(ROOT, 'supabase/seed/seed.sql');
  writeFileSync(seedPath, photoSeedSql(readFileSync(seedPath, 'utf8'), found, DEMO_PLACES));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
