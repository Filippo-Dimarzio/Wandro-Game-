export interface WikidataInfo {
  description: string | null;
  imageFile: string | null;
}

/** Fetches English descriptions and the P18 image for up to 50 Wikidata ids per request. */
export async function fetchWikidata(ids: string[]): Promise<Map<string, WikidataInfo>> {
  const out = new Map<string, WikidataInfo>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url =
      'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=descriptions|claims&languages=en&ids=' +
      batch.join('|');
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WandroImporter/0.1 (contact: see repo)' },
    });
    if (!res.ok) throw new Error(`Wikidata ${res.status}`);
    const json = (await res.json()) as {
      entities: Record<
        string,
        {
          descriptions?: { en?: { value: string } };
          claims?: { P18?: { mainsnak: { datavalue?: { value: string } } }[] };
        }
      >;
    };
    for (const [id, e] of Object.entries(json.entities)) {
      out.set(id, {
        description: e.descriptions?.en?.value ?? null,
        imageFile: e.claims?.P18?.[0]?.mainsnak.datavalue?.value ?? null,
      });
    }
  }
  return out;
}

/** Stable Wikimedia Commons URL for a file name (attribution is taken from the file page). */
export function commonsFileUrl(file: string, width = 1080): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, '_'))}?width=${width}`;
}
