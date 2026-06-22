import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// CORRECTION TS2339 : Cast de import.meta en 'any' pour éviter les erreurs d'environnement sous Vite au build
const metaEnv = (import.meta as any).env

const supabaseUrl = metaEnv?.VITE_SUPABASE_URL
const supabaseAnonKey = metaEnv?.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

/**
 * Client Supabase principal fortement typé.
 * Idéal pour les requêtes de lecture (.select()) afin de bénéficier de l'auto-complétion des champs.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

/**
 * Raccourci utilitaire pour contourner les erreurs strictes de types lors des mutations.
 * À utiliser sur les formulaires d'écriture : sbWritable('table').insert(...) ou .update(...)
 */
export const sbWritable = (tableName: keyof Database['public']['Tables']) => {
  return (supabase.from(tableName) as any)
}
