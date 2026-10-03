import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { env, isDemo } from './env';

export const supabase: SupabaseClient | null = isDemo
  ? null
  : createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured (demo mode).');
  return supabase;
}
