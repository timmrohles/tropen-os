import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { resolve } from 'path'

async function main() {
  const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  const dbUrl = env.split('\n').find(l => l.startsWith('DATABASE_URL='))?.split('=').slice(1).join('=')?.trim()
  if (!dbUrl) { console.error('DATABASE_URL not found'); process.exit(1) }

  console.log('Connecting to:', dbUrl.replace(/:([^:@]+)@/, ':***@'))

  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })

  const tables = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
    AND table_name IN ('workspace_participants','workspaces','cards','connections','knowledge_entries','operators','outcomes','workspace_messages')
    ORDER BY table_name
  `)
  console.log('tables:', tables.rows.map(x => x.table_name))

  const enums = await pool.query(`
    SELECT typname FROM pg_type
    WHERE typname IN ('participant_role','card_type','workspace_domain','card_status','connection_type','operator_type','outcome_type')
    ORDER BY typname
  `)
  console.log('enums:', enums.rows.map(x => x.typname))

  await pool.end()
}

main().catch(e => { console.error(e.message); process.exit(1) })
