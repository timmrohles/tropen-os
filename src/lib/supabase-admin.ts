import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Nur server-seitig verwenden (API Routes) — nie im Client!
// Lazy init via Proxy — vermeidet module-level createClient() beim Next.js Build
let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _client
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    const client = getClient()
    const value = (client as unknown as Record<string, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
