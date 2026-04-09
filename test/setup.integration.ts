import { beforeAll } from 'vitest'

beforeAll(() => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Integration Tests benötigen NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.test.local'
    )
  }
  const dbHost = process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1]
  console.log(`\n[Integration] Supabase: ${dbHost}`)
})
