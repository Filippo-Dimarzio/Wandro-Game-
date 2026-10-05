export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  /** Google Sheet web app that collects /join sign-ups on the demo site (docs/waitlist). */
  waitlistUrl: process.env.EXPO_PUBLIC_WAITLIST_URL ?? '',
};

/** Without Supabase credentials the app runs fully on-device with demo data. */
export const isDemo = !env.supabaseUrl || !env.supabaseAnonKey;

/** Shortened dwell so the demo can be tried in seconds; the server uses the real value. */
export const DEMO_DWELL_SECONDS = 8;

/** Default demo position: Sintra town centre. */
export const SINTRA_CENTER = { lat: 38.7975, lng: -9.3905 };
