/**
 * The storybook map: a hand-painted city map look (peach ground, mint parks, periwinkle water with
 * a coral shore, soft cream streets, few labels). Drawn from OpenStreetMap vector tiles hosted by
 * OpenFreeMap (OpenMapTiles schema), so the same style works on the web (MapLibre) and in the
 * native apps (Mapbox, via styleJSON).
 */
export interface StorybookPalette {
  ground: string;
  street: string;
  avenue: string;
  park: string;
  wood: string;
  sand: string;
  water: string;
  shore: string;
  rail: string;
  /** Outline under every street, so streets stay visible on the ground and under the mist. */
  casing: string;
  label: string;
  halo: string;
}

export const STORYBOOK: Record<'light' | 'dark', StorybookPalette> = {
  light: {
    ground: '#F5D9BE',
    street: '#FBF1E4',
    avenue: '#FFF8EE',
    park: '#AADEBB',
    wood: '#8FCFA3',
    sand: '#F8E7C9',
    water: '#8FABEB',
    shore: '#E8806A',
    rail: '#E2B797',
    casing: '#D29E7B',
    label: '#2F3E7A',
    halo: '#FBF1E4',
  },
  dark: {
    ground: '#2A2236',
    street: '#4A3F57',
    avenue: '#5B4F69',
    park: '#2F5A45',
    wood: '#294F3D',
    sand: '#463B33',
    water: '#2C3F7A',
    shore: '#B8655A',
    rail: '#5E4C55',
    casing: '#17121F',
    label: '#F3E6D6',
    halo: '#2A2236',
  },
};

export const BASE_SOURCE = 'base';
/** Where the storybook tiles and fonts come from. */
export const STORYBOOK_HOST = 'tiles.openfreemap.org';
const TILES_URL = `https://${STORYBOOK_HOST}/planet`;
const GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const FONT_ITALIC = ['Noto Sans Italic'];
const FONT_BOLD = ['Noto Sans Bold'];

// Loose JSON types: the same object feeds MapLibre's StyleSpecification and Mapbox's styleJSON.
type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
type Layer = { id: string; type: string; paint?: Record<string, Json> } & Record<string, Json>;

/** Paint values that change with the theme, as [layer, property, value]; applied live on the web. */
export function storybookPaint(p: StorybookPalette): [string, string, string][] {
  return [
    ['sb-ground', 'background-color', p.ground],
    ['sb-sand', 'fill-color', p.sand],
    ['sb-wood', 'fill-color', p.wood],
    ['sb-park', 'fill-color', p.park],
    ['sb-cemetery', 'fill-color', p.park],
    ['sb-shore', 'line-color', p.shore],
    ['sb-water', 'fill-color', p.water],
    ['sb-river', 'line-color', p.water],
    ['sb-rail', 'line-color', p.rail],
    ['sb-street-case', 'line-color', p.casing],
    ['sb-avenue-case', 'line-color', p.casing],
    ['sb-street', 'line-color', p.street],
    ['sb-avenue', 'line-color', p.avenue],
    ['sb-street-name', 'text-color', p.label],
    ['sb-street-name', 'text-halo-color', p.halo],
    ['sb-water-name', 'text-color', p.label],
    ['sb-water-name', 'text-halo-color', p.halo],
    ['sb-place', 'text-color', p.label],
    ['sb-place', 'text-halo-color', p.halo],
  ];
}

const width = (stops: [number, number][]): Json => [
  'interpolate',
  ['exponential', 1.6],
  ['zoom'],
  ...stops.flat(),
];

const MINOR = ['minor', 'service', 'track', 'path'];
const MAJOR = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'];

export function storybookStyle(p: StorybookPalette): Record<string, Json> {
  const layers: Layer[] = [
    { id: 'sb-ground', type: 'background', paint: {} },
    {
      id: 'sb-sand',
      type: 'fill',
      source: BASE_SOURCE,
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'sand'],
      paint: {},
    },
    {
      id: 'sb-wood',
      type: 'fill',
      source: BASE_SOURCE,
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'wood'],
      paint: {},
    },
    {
      id: 'sb-park',
      type: 'fill',
      source: BASE_SOURCE,
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'grass'],
      paint: {},
    },
    {
      id: 'sb-cemetery',
      type: 'fill',
      source: BASE_SOURCE,
      'source-layer': 'landuse',
      filter: ['==', ['get', 'class'], 'cemetery'],
      paint: {},
    },
    // The coral shore: a soft line drawn just outside the water.
    {
      id: 'sb-shore',
      type: 'line',
      source: BASE_SOURCE,
      'source-layer': 'water',
      layout: { 'line-join': 'round' },
      paint: {
        'line-width': width([
          [10, 3],
          [14, 8],
          [17, 16],
        ]),
      },
    },
    {
      id: 'sb-water',
      type: 'fill',
      source: BASE_SOURCE,
      'source-layer': 'water',
      paint: {},
    },
    {
      id: 'sb-river',
      type: 'line',
      source: BASE_SOURCE,
      'source-layer': 'waterway',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-width': width([
          [10, 1],
          [16, 5],
        ]),
      },
    },
    {
      id: 'sb-rail',
      type: 'line',
      source: BASE_SOURCE,
      'source-layer': 'transportation',
      minzoom: 12,
      filter: ['in', ['get', 'class'], ['literal', ['rail', 'transit']]],
      paint: { 'line-width': 1.5, 'line-dasharray': [3, 2] },
    },
    // Streets: cream ribbons with round ends on a darker outline, so they read at every zoom.
    {
      id: 'sb-street-case',
      type: 'line',
      source: BASE_SOURCE,
      'source-layer': 'transportation',
      minzoom: 12,
      filter: ['in', ['get', 'class'], ['literal', MINOR]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-width': width([
          [12, 2],
          [14, 4.5],
          [16, 9],
          [18, 18],
        ]),
      },
    },
    {
      id: 'sb-avenue-case',
      type: 'line',
      source: BASE_SOURCE,
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', MAJOR]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-width': width([
          [8, 2],
          [13, 5.5],
          [16, 12],
          [18, 25],
        ]),
      },
    },
    {
      id: 'sb-street',
      type: 'line',
      source: BASE_SOURCE,
      'source-layer': 'transportation',
      minzoom: 12,
      filter: ['in', ['get', 'class'], ['literal', MINOR]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-width': width([
          [12, 1],
          [14, 2.5],
          [16, 6],
          [18, 14],
        ]),
      },
    },
    {
      id: 'sb-avenue',
      type: 'line',
      source: BASE_SOURCE,
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', MAJOR]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-width': width([
          [8, 1],
          [13, 3.5],
          [16, 9],
          [18, 20],
        ]),
      },
    },
    // Few labels: main avenues, water and neighbourhoods. No shops, house numbers or road shields.
    {
      id: 'sb-street-name',
      type: 'symbol',
      source: BASE_SOURCE,
      'source-layer': 'transportation_name',
      minzoom: 14,
      filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary']]],
      layout: {
        'symbol-placement': 'line',
        'text-field': ['get', 'name'],
        'text-font': FONT_ITALIC,
        'text-size': 11,
      },
      paint: { 'text-halo-width': 1.5 },
    },
    {
      id: 'sb-water-name',
      type: 'symbol',
      source: BASE_SOURCE,
      'source-layer': 'water_name',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': FONT_ITALIC,
        'text-size': 14,
        'text-letter-spacing': 0.2,
      },
      paint: { 'text-halo-width': 1.5 },
    },
    {
      id: 'sb-place',
      type: 'symbol',
      source: BASE_SOURCE,
      'source-layer': 'place',
      filter: [
        'in',
        ['get', 'class'],
        ['literal', ['city', 'town', 'village', 'suburb', 'quarter', 'neighbourhood']],
      ],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': FONT_BOLD,
        'text-size': ['match', ['get', 'class'], ['city', 'town'], 18, 13],
        'text-max-width': 8,
      },
      paint: { 'text-halo-width': 2 },
    },
  ];
  for (const [id, prop, value] of storybookPaint(p)) {
    const layer = layers.find((l) => l.id === id)!;
    layer.paint = { ...layer.paint, [prop]: value };
  }
  return {
    version: 8,
    glyphs: GLYPHS_URL,
    sources: { [BASE_SOURCE]: { type: 'vector', url: TILES_URL } },
    layers,
  };
}
