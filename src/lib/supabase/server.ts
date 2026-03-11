import { createClient } from '@supabase/supabase-js'

/**
 * Service-Role Supabase Client für API-Routes.
 * Umgeht RLS — ausschliesslich server-seitig verwenden.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase Service Role Credentials fehlen in .env.local')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}
