// src/lib/agents/agent-catalog.ts
// Registry of all agent rule documents.
// 3 manually written (Sprint 4a) + 18 committee-generated (Sprint 5).
// Sprint 5b: all 18 committee agents normalized to template standard + rules in registry.

export interface AgentDefinition {
  id: string
  name: string
  filename: string
  version: string
  categoryIds: number[]
  themes: string[]
  ruleCount: number
  status: 'active' | 'draft' | 'deprecated'
  createdBy: 'manual' | 'committee'
  createdAt: string
  /** When the agent was last normalized to template standard (Sprint 5b+) */
  lastNormalized?: string
}

// ── Manually written (Sprint 4a) ─────────────────────────────────────────────

const MANUAL_AGENTS: AgentDefinition[] = [
  {
    id: 'architecture',
    name: 'Architecture',
    filename: 'ARCHITECTURE_AGENT_v3.md',
    version: '3.0',
    categoryIds: [1, 25],
    themes: ['layers', 'boundaries', 'dependencies', 'folder-structure', 'circular-deps'],
    ruleCount: 8,
    status: 'active',
    createdBy: 'manual',
    createdAt: '2026-04-03',
    lastNormalized: '2026-04-03',
  },
  {
    id: 'security',
    name: 'Security',
    filename: 'SECURITY_AGENT_FINAL.md',
    version: '2.1',
    categoryIds: [3, 4, 22],
    themes: ['auth', 'secrets', 'injection', 'cors', 'ssrf', 'csrf', 'rls', 'prompt-injection'],
    ruleCount: 9,
    status: 'active',
    createdBy: 'manual',
    createdAt: '2026-04-03',
    lastNormalized: '2026-04-03',
  },
  {
    id: 'observability',
    name: 'Observability',
    filename: 'OBSERVABILITY_AGENT_v3.md',
    version: '3.0',
    categoryIds: [12],
    themes: ['logging', 'metrics', 'tracing', 'alerts', 'structured-logs', 'no-pii'],
    ruleCount: 8,
    status: 'active',
    createdBy: 'manual',
    createdAt: '2026-04-03',
    lastNormalized: '2026-04-03',
  },
]

// ── Committee-generated (Sprint 5) — normalized Sprint 5b ────────────────────

const COMMITTEE_AGENTS: AgentDefinition[] = [
  // Round 1 — no dependencies
  {
    id: 'code-style',
    name: 'Code Style',
    filename: 'CODE_STYLE_AGENT.md',
    version: '1.0',
    categoryIds: [2, 25],
    themes: ['naming', 'formatting', 'complexity', 'magic-numbers', 'dead-code', 'file-size'],
    ruleCount: 9,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'error-handling',
    name: 'Error Handling',
    filename: 'ERROR_HANDLING_AGENT.md',
    version: '1.0',
    categoryIds: [2, 6],
    themes: ['error-lifecycle', 'recovery', 'user-messages', 'try-catch', 'graceful-degradation'],
    ruleCount: 7,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'database',
    name: 'Database',
    filename: 'DATABASE_AGENT.md',
    version: '1.0',
    categoryIds: [5],
    themes: ['schema-design', 'indexes', 'migrations', 'fk-constraints', 'pitr', 'soft-delete', 'rls'],
    ruleCount: 8,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'dependencies',
    name: 'Dependencies',
    filename: 'DEPENDENCIES_AGENT.md',
    version: '1.0',
    categoryIds: [14, 24],
    themes: ['lockfiles', 'cve-scanning', 'dependabot', 'sbom', 'supply-chain', 'node-version'],
    ruleCount: 8,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'git-governance',
    name: 'Git Governance',
    filename: 'GIT_GOVERNANCE_AGENT.md',
    version: '1.0',
    categoryIds: [19],
    themes: ['conventional-commits', 'branch-protection', 'semantic-versioning', 'atomic-commits', 'codeowners'],
    ruleCount: 7,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'backup-dr',
    name: 'Backup & DR',
    filename: 'BACKUP_DR_AGENT.md',
    version: '1.0',
    categoryIds: [13],
    themes: ['3-2-1-rule', 'pitr', 'restore-tests', 'dr-runbook', 'rto-rpo', 'incident-classification'],
    ruleCount: 7,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },

  // Round 2 — reference Round 1 agents
  {
    id: 'testing',
    name: 'Testing',
    filename: 'TESTING_AGENT.md',
    version: '1.0',
    categoryIds: [10],
    themes: ['unit-tests', 'integration-tests', 'e2e', 'coverage', 'test-pyramid', 'ai-code-gates', 'fixtures'],
    ruleCount: 8,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'performance',
    name: 'Performance',
    filename: 'PERFORMANCE_AGENT.md',
    version: '1.0',
    categoryIds: [7],
    themes: ['core-web-vitals', 'bundle-size', 'lazy-loading', 'caching', 'pagination', 'n-plus-1'],
    ruleCount: 7,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'platform',
    name: 'Platform & CI/CD',
    filename: 'PLATFORM_AGENT.md',
    version: '1.0',
    categoryIds: [11, 23],
    themes: ['ci-pipeline', 'deployment', 'staging', 'rollback', 'iac', 'zero-downtime', 'health-checks'],
    ruleCount: 8,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'api',
    name: 'API Design',
    filename: 'API_AGENT.md',
    version: '1.0',
    categoryIds: [6],
    themes: ['versioning', 'openapi', 'resilience', 'timeout-retry', 'circuit-breaker', 'webhook-signature', 'vendor-abstraction'],
    ruleCount: 7,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'cost-awareness',
    name: 'Cost Awareness',
    filename: 'COST_AWARENESS_AGENT.md',
    version: '1.0',
    categoryIds: [20],
    themes: ['cloud-budget-alerts', 'token-budgets', 'rate-limits', 'vendor-lock-in', 'exit-strategy', 'license-compliance'],
    ruleCount: 7,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'scalability',
    name: 'Scalability',
    filename: 'SCALABILITY_AGENT.md',
    version: '1.0',
    categoryIds: [8, 9],
    themes: ['stateless-server', 'job-queues', 'load-tests', 'state-categories', 'optimistic-updates', 'scaling-runbook'],
    ruleCount: 7,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },

  // Round 3 — reference Round 1+2 agents
  {
    id: 'accessibility',
    name: 'Accessibility',
    filename: 'ACCESSIBILITY_AGENT.md',
    version: '1.0',
    categoryIds: [16],
    themes: ['wcag-2.1-aa', 'semantic-html', 'aria', 'focus-management', 'color-contrast', 'keyboard-nav', 'screen-reader'],
    ruleCount: 8,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'design-system',
    name: 'Design System',
    filename: 'DESIGN_SYSTEM_AGENT.md',
    version: '1.0',
    categoryIds: [15],
    themes: ['design-tokens', 'component-library', 'component-lifecycle', 'no-hardcoding', 'theming', 'consistency'],
    ruleCount: 7,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'content',
    name: 'Content & i18n',
    filename: 'CONTENT_AGENT.md',
    version: '1.0',
    categoryIds: [17, 15],
    themes: ['i18n-framework', 'externalized-strings', 'locale-formatting', 'error-messages', 'microcopy', 'rtl'],
    ruleCount: 7,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'legal',
    name: 'Legal & Compliance',
    filename: 'LEGAL_AGENT.md',
    version: '1.0',
    categoryIds: [4],
    themes: ['gdpr', 'ai-act', 'pii', 'consent', 'data-deletion', 'legal-basis', 'dpa', 'data-retention', 'privacy-by-design'],
    ruleCount: 8,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'ai-integration',
    name: 'AI Integration',
    filename: 'AI_INTEGRATION_AGENT.md',
    version: '1.0',
    categoryIds: [22],
    themes: ['prompt-injection-defense', 'token-limits', 'fallback-strategy', 'output-validation', 'model-abstraction', 'caching', 'deterministic-mode'],
    ruleCount: 8,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    filename: 'ANALYTICS_AGENT.md',
    version: '1.0',
    categoryIds: [12],
    themes: ['event-schemas', 'user-vs-system-separation', 'consent-for-tracking', 'anonymization', 'no-observability-overlap'],
    ruleCount: 7,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
]

// ── Sprint 7: Security Scan Agent ────────────────────────────────────────────

const SPRINT7_AGENTS: AgentDefinition[] = [
  {
    id: 'security-scan',
    name: 'Security Scan',
    filename: 'SECURITY_SCAN_AGENT.md',
    version: '1.0',
    categoryIds: [3, 22, 24],
    themes: ['injection', 'xss', 'ssrf', 'eval', 'path-traversal', 'hardcoded-secrets', 'auth-tokens', 'prototype-pollution', 'weak-crypto', 'mass-assignment', 'idor', 'prompt-injection', 'llm-output-eval', 'supply-chain'],
    ruleCount: 8,
    status: 'active',
    createdBy: 'committee',
    createdAt: '2026-04-09',
    lastNormalized: '2026-04-09',
  },
]

export const AGENT_CATALOG: AgentDefinition[] = [
  ...MANUAL_AGENTS,
  ...COMMITTEE_AGENTS,
  ...SPRINT7_AGENTS,
]

/** Returns only active agents */
export function getActiveAgents(): AgentDefinition[] {
  return AGENT_CATALOG.filter((a) => a.status === 'active')
}

/** Returns agent by id, or undefined */
export function getAgent(id: string): AgentDefinition | undefined {
  return AGENT_CATALOG.find((a) => a.id === id)
}
