import { createClient } from '@supabase/supabase-js'
import { getDomainForRule } from '../lib/audit/domain-filter'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
)

const { data: run } = await sb.from('audit_runs').select('id').order('created_at', { ascending: false }).limit(1).single()
console.log('Run:', run?.id)

const { data: findings } = await sb
  .from('audit_findings')
  .select('rule_id, agent_source, status')
  .eq('run_id', run?.id ?? '')
  .limit(500)

const domainCounts: Record<string, number> = {}
for (const f of findings ?? []) {
  const domain = getDomainForRule(f.rule_id as string)
  domainCounts[domain] = (domainCounts[domain] ?? 0) + 1
}

console.log('\nDomain counts in latest run:')
for (const [domain, count] of Object.entries(domainCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${domain.padEnd(20)} ${count}`)
}

// Speziell: offene Findings pro Domain
const openFindings = (findings ?? []).filter(f => f.status === 'open' || f.status === 'acknowledged')
const openDomains = new Set(openFindings.map(f => getDomainForRule(f.rule_id as string)))
console.log('\nDomains with OPEN findings (should show as chips):')
for (const d of [...openDomains].sort()) {
  console.log(' ', d)
}
