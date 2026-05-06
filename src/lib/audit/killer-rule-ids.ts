// src/lib/audit/killer-rule-ids.ts
// ADR-027 Schritt 6 + Sprint 9-Critical-Killer (2026-05-06).
// Severity-Coupling: severity='critical' → automatisch Killer.
// KILLER_RULE_IDS: explizite Killer die nicht über Severity erkannt werden (z.B. Build-Fehler).

export const KILLER_RULE_IDS = new Set([
  // Universal — alle Profile
  'cat-3-rule-20',          // SQL/Cmd/Path-Injection
  'cat-3-rule-21',          // Hardcoded Secrets / Token-Storage
  'cat-3-rule-build',       // Production-Build schlägt fehl
  // Public — Profile 3-5
  'cat-3-rule-18',          // Wildcard CORS auf Public-Endpoints
  // Multi-User — Profile 4-5
  'cat-3-rule-15',          // API-Routes ohne Auth-Check
  // Config-Killer — alle Profile
  'config-killer-db-ssl',   // DB-Connection ohne SSL
  'config-killer-dev-secret', // Production-Secrets in Dev-Config
  'config-killer-https',    // Keine HTTPS-Erzwingung
])

export function isKillerByRuleId(ruleId: string): boolean {
  if (KILLER_RULE_IDS.has(ruleId)) return true
  if (ruleId.startsWith('npm-audit-') && ruleId.includes('-critical-')) return true
  return false
}

/** Sprint 9-Critical-Killer — Severity-Coupling + Rule-ID-Check. Einziger Killer-Entscheid. */
export function shouldBeKiller(severity: string, ruleId: string): boolean {
  if (severity === 'critical') return true
  return isKillerByRuleId(ruleId)
}

/** Effort-Schätzung aus fixType (aus quick-wins.ts portiert, muss synchron bleiben) */
export function effortMinutesFromFixType(fixType: string | null | undefined): number {
  switch (fixType) {
    case 'code-gen':    return 10
    case 'code-fix':    return 15
    case 'refactoring': return 45
    case 'manual':      return 60
    default:            return 60
  }
}

export type EffortLevel = 'quick' | 'medium' | 'long'

export function effortLevel(minutes: number): EffortLevel {
  if (minutes <= 15) return 'quick'
  if (minutes <= 45) return 'medium'
  return 'long'
}

// Sprint 9-Polish-2: Klassen statt Minuten — keine falsche Präzision (Marken-Brief 28.1)
// Sortier-Logik bleibt intern minutenbasiert, UI zeigt nur Klassen.
export const EFFORT_LABEL: Record<EffortLevel, string> = {
  quick:  'Quick Win',
  medium: 'Mittel',
  long:   'Größer',
}
