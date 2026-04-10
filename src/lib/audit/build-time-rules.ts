// src/lib/audit/build-time-rules.ts
// Die 26 wichtigsten Build-Time-Regeln aus den Tropen OS Agenten.
//
// Build-Time Rules = Regeln die WÄHREND des Bauens im Coding-Tool
// aktiv sein sollen (.cursorrules / CLAUDE.md).
//
// Trennung von Audit-Time Rules (alle 195, nur beim Scan relevant).

export interface BuildTimeRule {
  id: string
  /** Kategorie für Gruppierung in der Export-Datei */
  group: string
  /** Kurzname der Regel */
  name: string
  /** Priorität — beeinflusst ob die Regel in kompakten Exporten dabei ist */
  priority: 'critical' | 'high' | 'medium'
  /** Die LLM-Anweisung — imperativ, konkret, actionable */
  instruction: string
  /** Für welche Agent-IDs gilt diese Regel */
  agentIds: string[]
  /** Gilt immer oder nur wenn bestimmte Features aktiv sind */
  applicability: 'always' | 'if-auth' | 'if-ai' | 'if-db' | 'if-public' | 'if-uploads'
}

// ── 26 kuratierte Build-Time-Regeln ──────────────────────────────────────────

export const BUILD_TIME_RULES: BuildTimeRule[] = [
  // SECURITY (5 Regeln — alle critical/high)
  {
    id: 'sec-no-secrets',
    group: 'Sicherheit',
    name: 'Keine Secrets im Code',
    priority: 'critical',
    instruction:
      'Niemals API Keys, Tokens, Passwörter oder Connection Strings im Code committen. ' +
      'Immer aus Environment-Variablen lesen: `process.env.VARIABLE_NAME`. ' +
      'Variablen beim App-Start validieren — fehlendes Secret = Crash statt Silent Failure.',
    agentIds: ['security'],
    applicability: 'always',
  },
  {
    id: 'sec-validate-input',
    group: 'Sicherheit',
    name: 'Alle Inputs validieren',
    priority: 'critical',
    instruction:
      'Alle externen Inputs (Request Body, Query Params, Headers, Webhook Payloads) ' +
      'mit Zod validieren — bevor jede andere Logik ausgeführt wird. ' +
      'Kein direktes `req.body.field` ohne Schema-Validierung.',
    agentIds: ['security'],
    applicability: 'always',
  },
  {
    id: 'sec-auth-first',
    group: 'Sicherheit',
    name: 'Auth als erste Zeile',
    priority: 'critical',
    instruction:
      'Jede API-Route die Nutzerdaten verarbeitet: Auth-Check als erste Operation, ' +
      'noch vor Validierung und Business-Logik. ' +
      'Nicht-autentifizierte Requests sofort mit 401 ablehnen.',
    agentIds: ['security'],
    applicability: 'if-auth',
  },
  {
    id: 'sec-no-error-leak',
    group: 'Sicherheit',
    name: 'Keine Error-Details an Client',
    priority: 'critical',
    instruction:
      'Niemals `error.message`, Stack Traces oder interne Fehlercodes an den Client zurückgeben. ' +
      'Server-seitig vollständig loggen, Client erhält nur: `{ error: "Ein Fehler ist aufgetreten" }`. ' +
      'Kein `return NextResponse.json({ error: err.message })`.',
    agentIds: ['security', 'error-handling'],
    applicability: 'always',
  },
  {
    id: 'sec-no-sql-concat',
    group: 'Sicherheit',
    name: 'Keine String-Konkatenation in Queries',
    priority: 'critical',
    instruction:
      'Keine String-Interpolation in SQL-Queries oder anderen Query-Sprachen. ' +
      'Ausschließlich parametrisierte Statements oder ORM-Methoden nutzen. ' +
      'Falsch: `db.query("SELECT * WHERE id=" + userId)` — ' +
      'Richtig: `db.query("SELECT * WHERE id=$1", [userId])`.',
    agentIds: ['security', 'database'],
    applicability: 'always',
  },

  // CODE-QUALITÄT (4 Regeln)
  {
    id: 'style-no-any',
    group: 'Code-Qualität',
    name: 'TypeScript strict — kein any',
    priority: 'high',
    instruction:
      'TypeScript strict mode ist aktiv. Kein `any` ohne inline Kommentar mit Begründung. ' +
      'Bei unbekannten Typen: `unknown` statt `any`, dann narrowen. ' +
      'Typ-Assertions (`as X`) nur wenn kein anderer Weg möglich.',
    agentIds: ['code-style'],
    applicability: 'always',
  },
  {
    id: 'style-fn-size',
    group: 'Code-Qualität',
    name: 'Funktionsgröße begrenzen',
    priority: 'medium',
    instruction:
      'Funktionen über 50 Zeilen aufteilen. Eine Funktion = eine klar benennbare Aufgabe. ' +
      'Hilfsfunktionen extrahieren statt verschachteln. ' +
      'Lange Funktionen sind ein Signal für zu viel Verantwortung.',
    agentIds: ['code-style'],
    applicability: 'always',
  },
  {
    id: 'style-file-size',
    group: 'Code-Qualität',
    name: 'Dateigröße begrenzen',
    priority: 'high',
    instruction:
      'Dateien über 300 Zeilen: Warnung, prüfe ob Aufteilen möglich. ' +
      'Dateien über 500 Zeilen: Pflicht aufteilen — Logik in separate Module extrahieren. ' +
      'Ausnahme: Migrations, generierter Code, Konfigurationsdateien.',
    agentIds: ['code-style'],
    applicability: 'always',
  },
  {
    id: 'style-no-dead-code',
    group: 'Code-Qualität',
    name: 'Kein Dead Code committen',
    priority: 'medium',
    instruction:
      'Keinen auskommentierten Code in Commits einschließen. ' +
      'Ungenutzte Variablen, Imports und Funktionen vor dem Commit entfernen. ' +
      'Git-History ist die Aufzeichnung — auskommentierter Code gehört in Commits, nicht in den Code.',
    agentIds: ['code-style'],
    applicability: 'always',
  },

  // FEHLERBEHANDLUNG (3 Regeln)
  {
    id: 'err-trycatch',
    group: 'Fehlerbehandlung',
    name: 'Try/Catch in allen API-Routes',
    priority: 'high',
    instruction:
      'Jede API-Route: vollständiges try/catch um den gesamten Handler-Body. ' +
      'Catch-Block: Fehler vollständig server-seitig loggen, Client erhält strukturierte JSON-Response: ' +
      '`{ error: string, code?: string }` mit Status 500.',
    agentIds: ['error-handling'],
    applicability: 'always',
  },
  {
    id: 'err-user-friendly',
    group: 'Fehlerbehandlung',
    name: 'Nutzerfreundliche Fehlermeldungen',
    priority: 'high',
    instruction:
      'Fehlermeldungen die der User sieht sind klar, hilfreich und ohne technische Details. ' +
      'Nicht "Internal Server Error" — sondern was schiefgelaufen ist und was der User tun kann. ' +
      'Validierungsfehler: spezifisch pro Feld, nicht generisch.',
    agentIds: ['error-handling'],
    applicability: 'always',
  },
  {
    id: 'err-external-fallback',
    group: 'Fehlerbehandlung',
    name: 'Fallback für externe Calls',
    priority: 'high',
    instruction:
      'Jeder externe Service-Call (API, Datenbank, LLM) hat: Timeout (default: 10s), ' +
      'Retry-Logik für transiente Fehler, und einen Fallback wenn der Service nicht erreichbar ist. ' +
      'Externe Abhängigkeiten dürfen nicht die gesamte App zum Absturz bringen.',
    agentIds: ['error-handling', 'api'],
    applicability: 'always',
  },

  // ARCHITEKTUR (3 Regeln)
  {
    id: 'arch-business-logic',
    group: 'Architektur',
    name: 'Business-Logik in lib/',
    priority: 'high',
    instruction:
      'Business-Logik gehört in `lib/` oder `actions/` — niemals in `page.tsx`, ' +
      'Layout-Komponenten oder UI-Komponenten. ' +
      'Seiten sind nur Routing + Datenfetching, Komponenten nur Rendering.',
    agentIds: ['architecture'],
    applicability: 'always',
  },
  {
    id: 'arch-no-circular',
    group: 'Architektur',
    name: 'Keine zirkulären Abhängigkeiten',
    priority: 'medium',
    instruction:
      'Keine zirkulären Imports zwischen Modulen. Dependency-Richtung: ' +
      'app/ → components/ → lib/ → utils/ (nur abwärts). ' +
      'Wenn zwei Module sich gegenseitig importieren: gemeinsame Abstraktion extrahieren.',
    agentIds: ['architecture'],
    applicability: 'always',
  },
  {
    id: 'arch-no-client-db',
    group: 'Architektur',
    name: 'Kein DB-Zugriff vom Frontend',
    priority: 'critical',
    instruction:
      'Niemals Datenbank-Clients (Supabase, Prisma, etc.) direkt aus Client-Komponenten aufrufen. ' +
      'Alle Datenbankzugriffe gehen über Server Components, API Routes oder Server Actions. ' +
      'Service-Role-Keys (`supabaseAdmin`) nur server-seitig — nie im Client-Bundle.',
    agentIds: ['architecture', 'security'],
    applicability: 'if-db',
  },

  // DATENBANK (3 Regeln)
  {
    id: 'db-tenant-isolation',
    group: 'Datenbank',
    name: 'Tenant-Isolation in allen Queries',
    priority: 'critical',
    instruction:
      'Alle DB-Queries auf User- oder Org-Daten: immer `WHERE organization_id = ?` Filter. ' +
      'Niemals Daten ohne Tenant-Filter abfragen — das wäre ein Datenleck zwischen Orgs. ' +
      'Zusätzlich: RLS-Policies in Supabase als zweite Sicherheitslinie.',
    agentIds: ['database', 'security'],
    applicability: 'if-db',
  },
  {
    id: 'db-migrations',
    group: 'Datenbank',
    name: 'Schema-Änderungen nur via Migrations',
    priority: 'high',
    instruction:
      'Alle Datenbankschema-Änderungen als versionierte Migration-Dateien — niemals direktes ' +
      'ALTER TABLE oder CREATE TABLE in Production. ' +
      'Migrations müssen rückwärtskompatibel sein (kein DROP COLUMN ohne Deprecation-Phase).',
    agentIds: ['database'],
    applicability: 'if-db',
  },
  {
    id: 'db-soft-delete',
    group: 'Datenbank',
    name: 'Soft-Delete statt Hard-Delete',
    priority: 'medium',
    instruction:
      'Nutzerdaten niemals hart löschen wenn sie referenziert sein könnten. ' +
      '`deleted_at TIMESTAMP` Spalte nutzen, Queries filtern mit `WHERE deleted_at IS NULL`. ' +
      'Hard-Delete nur für explizit temporäre Daten (Sessions, Logs nach Retention-Periode).',
    agentIds: ['database'],
    applicability: 'if-db',
  },

  // PERFORMANCE (2 Regeln)
  {
    id: 'perf-no-n1',
    group: 'Performance',
    name: 'Keine N+1-Queries',
    priority: 'high',
    instruction:
      'Keine N+1-Queries: nicht für jeden Item in einer Liste einen separaten DB-Call machen. ' +
      'Stattdessen: JOIN, IN-Clause, oder Batch-Fetching. ' +
      'Beispiel: Nicht `users.map(u => db.getProfile(u.id))` — sondern `db.getProfiles([...userIds])`.',
    agentIds: ['performance', 'database'],
    applicability: 'if-db',
  },
  {
    id: 'perf-next-image',
    group: 'Performance',
    name: 'next/image für Bilder',
    priority: 'medium',
    instruction:
      'In Next.js Projekten: immer `next/image` statt rohes `<img>` Tag für User-Bilder und wichtige Assets. ' +
      'next/image optimiert automatisch: WebP-Konvertierung, Lazy Loading, richtige Größen pro Viewport. ' +
      'Ausnahme: Icons und dekorative SVGs die sowieso klein sind.',
    agentIds: ['performance'],
    applicability: 'always',
  },

  // OBSERVABILITY (2 Regeln)
  {
    id: 'obs-structured-logging',
    group: 'Observability',
    name: 'Structured Logging',
    priority: 'high',
    instruction:
      'Niemals `console.log()` in Production-Code. ' +
      'Structured Logging mit `createLogger("scope")` aus `@/lib/logger`. ' +
      'Log-Levels korrekt nutzen: debug (Dev), info (User-Aktionen), warn (recoverable), error (Fehler).',
    agentIds: ['observability'],
    applicability: 'always',
  },
  {
    id: 'obs-no-pii-logs',
    group: 'Observability',
    name: 'Kein PII in Logs',
    priority: 'high',
    instruction:
      'Niemals PII (E-Mail-Adressen, Namen, IP-Adressen, Telefonnummern) in Log-Ausgaben. ' +
      'Nur anonymisierte IDs loggen. ' +
      'Falsch: `log.info("User logged in", { email })` — Richtig: `log.info("User logged in", { userId })`.',
    agentIds: ['observability'],
    applicability: 'always',
  },

  // TESTING (1 Regel)
  {
    id: 'test-critical-paths',
    group: 'Testing',
    name: 'Tests für kritische Business-Logik',
    priority: 'high',
    instruction:
      'Kritische Business-Logik (Auth, Zahlungen, Datenmutationen, Berechtigungslogik) braucht Unit-Tests. ' +
      'KI-generierter Code ohne Tests ist nicht production-ready. ' +
      'Minimum: Happy Path + ein Fehler-Fall pro kritischer Funktion.',
    agentIds: ['testing'],
    applicability: 'always',
  },

  // DEPENDENCIES (1 Regel)
  {
    id: 'dep-audit',
    group: 'Dependencies',
    name: 'Dependency-Audit vor Commit',
    priority: 'high',
    instruction:
      'Vor jedem Commit: `pnpm audit` ausführen. ' +
      'Keine Packages mit bekannten high/critical CVEs in Production-Dependencies. ' +
      'Neue Packages bewerten: Stars, letztes Update, Bundle-Size, TypeScript-Support.',
    agentIds: ['dependencies'],
    applicability: 'always',
  },

  // BARRIEREFREIHEIT (2 Regeln)
  {
    id: 'a11y-alt-text',
    group: 'Barrierefreiheit',
    name: 'Alt-Text für alle Bilder',
    priority: 'high',
    instruction:
      'Alle `<img>` Tags und `next/image` Komponenten haben alt-Text. ' +
      'Informative Bilder: beschreibender alt-Text. ' +
      'Dekorative Bilder: `alt=""` (leerer String, nicht weglassen).',
    agentIds: ['accessibility'],
    applicability: 'always',
  },
  {
    id: 'a11y-keyboard',
    group: 'Barrierefreiheit',
    name: 'Tastaturnavigation',
    priority: 'medium',
    instruction:
      'Alle interaktiven Elemente (Buttons, Links, Formulare, Dropdowns) sind per Tastatur erreichbar. ' +
      'Fokus-Indikator immer sichtbar — niemals `outline: none` ohne Custom Focus-Style. ' +
      '`<div onClick>` ist kein Button — `<button>` verwenden.',
    agentIds: ['accessibility'],
    applicability: 'always',
  },

  // AI-INTEGRATION (1 Regel — nur wenn KI-Features aktiv)
  {
    id: 'ai-no-prompt-injection',
    group: 'KI-Sicherheit',
    name: 'Kein User-Input in System-Prompts',
    priority: 'critical',
    instruction:
      'User-Input niemals direkt in System-Prompts interpolieren (Prompt Injection). ' +
      'User-Content strikt im "user"-Role trennen vom System-Prompt. ' +
      'Falsch: `role: "system", content: \`Du bist... ${userInput}\`` — ' +
      'System-Prompt muss statisch sein.',
    agentIds: ['security', 'ai-integration'],
    applicability: 'if-ai',
  },
]

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

/** Gibt alle Regeln nach Priorität sortiert zurück */
export function getRulesByPriority(): BuildTimeRule[] {
  const order = { critical: 0, high: 1, medium: 2 }
  return [...BUILD_TIME_RULES].sort((a, b) => order[a.priority] - order[b.priority])
}

/** Gibt Regeln für einen Kontext zurück (welche Features aktiv sind) */
export function getApplicableRules(features: {
  hasAuth?: boolean
  hasAi?: boolean
  hasDb?: boolean
  hasPublicApi?: boolean
  hasUploads?: boolean
}): BuildTimeRule[] {
  return BUILD_TIME_RULES.filter((rule) => {
    switch (rule.applicability) {
      case 'always': return true
      case 'if-auth': return features.hasAuth ?? true  // default: assume auth
      case 'if-ai': return features.hasAi ?? false
      case 'if-db': return features.hasDb ?? true      // default: assume db
      case 'if-public': return features.hasPublicApi ?? false
      case 'if-uploads': return features.hasUploads ?? false
      default: return true
    }
  })
}

/** Gibt Regeln gruppiert nach Kategorie zurück */
export function getRulesByGroup(rules: BuildTimeRule[]): Map<string, BuildTimeRule[]> {
  const grouped = new Map<string, BuildTimeRule[]>()
  for (const rule of rules) {
    const existing = grouped.get(rule.group) ?? []
    existing.push(rule)
    grouped.set(rule.group, existing)
  }
  return grouped
}

/** Gibt nur critical + high Regeln zurück (für kompakte Exporte) */
export function getCriticalRules(): BuildTimeRule[] {
  return BUILD_TIME_RULES.filter((r) => r.priority === 'critical' || r.priority === 'high')
}
