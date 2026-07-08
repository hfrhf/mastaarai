import { IStorageAdapter } from './types';
import { LocalStorageAdapter } from './localStorage';
import { SupabaseStorageAdapter } from './supabase';

let activeAdapter: IStorageAdapter | null = null;

export function getStorageAdapter(): IStorageAdapter {
  if (activeAdapter) return activeAdapter;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    console.log('Initializing Supabase Storage Adapter');
    activeAdapter = new SupabaseStorageAdapter();
  } else {
    console.log('Initializing LocalStorage Storage Adapter (No Supabase config found)');
    activeAdapter = new LocalStorageAdapter();
  }

  return activeAdapter;
}
