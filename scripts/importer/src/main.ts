/**
 * Idempotent place importer for any launch city (default: Sintra).
 *   pnpm import:places --dry-run                   -> prints JSON, writes nothing
 *   pnpm import:places                             -> upserts into Supabase as `draft`
 *   pnpm import:places --region lisbon [--dry-run] -> another city from REGIONS
 * Needs EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from .env) for writes.
 */
import { createClient } from '@supabase/supabase-js';
import { buildOverpassQuery, dedupe, regionFromArgs, toPlace, type OsmElement } from './mapping';
import { commonsFileUrl, fetchWikidata } from './wikidata';

const OVERPASS_URL = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';

async function fetchOsm(bbox: readonly number[]): Promise<OsmElement[]> {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: new URLSearchParams({ data: buildOverpassQuery(bbox) }),
    headers: { 'User-Agent': 'WandroImporter/0.1' },
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { elements: OsmElement[] }).elements;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const region = regionFromArgs(process.argv);
  console.error(`Importing ${region.name}, ${region.country}`);
  const elements = await fetchOsm(region.bbox);
  const places = dedupe(elements.map(toPlace).filter((p) => p !== null));
  console.error(`OSM elements: ${elements.length}, importable places: ${places.length}`);

  const wd = await fetchWikidata([
    ...new Set(places.flatMap((p) => (p.wikidata_id ? [p.wikidata_id] : []))),
  ]);

  const rows = places.map((p) => ({
    source: p.source,
    source_id: p.source_id,
    name: p.name,
    category: p.category,
    base_points: p.base_points,
    wikidata_id: p.wikidata_id,
    description:
      p.description ?? (p.wikidata_id ? wd.get(p.wikidata_id)?.description : null) ?? null,
    location: `SRID=4326;POINT(${p.lng} ${p.lat})`,
    // `status` is omitted on purpose: new rows default to 'draft' and curated rows keep theirs.
  }));

  if (dryRun) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { data: reg, error: regError } = await db
    .from('regions')
    .select('id')
    .eq('slug', region.slug)
    .single();
  if (regError) throw new Error(`Region ${region.slug} is missing; run the migrations first`);

  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db.from('places').upsert(
      rows.slice(i, i + 200).map((r) => ({ ...r, region_id: reg.id })),
      { onConflict: 'source,source_id' },
    );
    if (error) throw error;
  }

  const { data: saved, error } = await db
    .from('places')
    .select('id, wikidata_id')
    .eq('source', 'osm');
  if (error) throw error;
  await db.from('place_stats').upsert(
    saved.map((s) => ({ place_id: s.id })),
    { onConflict: 'place_id', ignoreDuplicates: true },
  );

  const photos = saved.flatMap((s) => {
    const file = s.wikidata_id ? wd.get(s.wikidata_id)?.imageFile : null;
    return file
      ? [
          {
            place_id: s.id,
            external_url: commonsFileUrl(file),
            source_url: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`,
            author: null,
            license: 'See Wikimedia Commons',
            is_primary: true,
          },
        ]
      : [];
  });
  if (photos.length) {
    await db
      .from('place_photos')
      .delete()
      .in(
        'place_id',
        photos.map((p) => p.place_id),
      )
      .eq('is_primary', true)
      .not('external_url', 'is', null);
    const { error: e2 } = await db.from('place_photos').insert(photos);
    if (e2) throw e2;
  }
  console.error(
    `Upserted ${rows.length} places (${photos.length} with photos). New places are 'draft' until reviewed.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
