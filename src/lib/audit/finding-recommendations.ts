// src/lib/audit/finding-recommendations.ts
// Static strategy recommendations per finding type.
// No LLM calls — written once, reused on every audit.

export type FixApproach = 'central-fix' | 'per-file' | 'config-change' | 'documentation'

export interface FindingRecommendation {
  id: string
  /** Matched against ruleId (exact or prefix) OR message substring (case-insensitive) */
  matchRuleIds?: string[]
  matchMessagePatterns?: RegExp[]
  title: string
  problem: string
  impact: string
  strategy: string
  firstStep: string
  fixApproach: FixApproach
}

export const FINDING_RECOMMENDATIONS: FindingRecommendation[] = [
  {
    id: 'file-size',
    matchRuleIds: ['cat-1-rule-4'],
    matchMessagePatterns: [/\d+\s*lines?/i, /zu (lang|viel|gross)/i],
    title: 'Dateien zu lang — systematisch aufteilen',
    problem:
      'Mehrere Dateien überschreiten die 300-Zeilen-Grenze. Große Dateien haben zu viele Verantwortlichkeiten, ' +
      'sind schwerer zu testen und erhöhen die kognitive Last beim Lesen. Einzelfixes helfen nicht — ' +
      'das Problem ist strukturell.',
    impact:
      'Jede Datei über 500 Zeilen ist ein aktives Risiko für Merge-Konflikte und unbeabsichtigte Seiteneffekte ' +
      'beim Refactoring.',
    strategy:
      'Einen Durchlauf planen: jede betroffene Datei nach Verantwortung aufteilen. ' +
      'Typische Splits: Hook/Logik extrahieren, Sub-Komponenten auslagern, ' +
      'Helper-Funktionen in eigene Utils verschieben. Commit pro Datei.',
    firstStep:
      'Die größte Datei zuerst: Verantwortlichkeiten identifizieren, dann je eine Verantwortung ' +
      'in eine neue Datei extrahieren. Ziel: < 300 Zeilen pro Datei.',
    fixApproach: 'per-file',
  },
  {
    id: 'error-leakage',
    matchRuleIds: ['cat-3-rule-19'],
    matchMessagePatterns: [/stack.trace|error.*leak|error.*intern/i, /stack-trace-response/i],
    title: 'Stack-Traces in API-Responses — zentralen Error-Handler einführen',
    problem:
      'API-Routen geben interne Fehlermeldungen (error.stack, error.message) direkt an den Client zurück. ' +
      'Das Problem tritt in vielen Routen auf, weil kein zentraler Error-Handler existiert. ' +
      'Einzelne Patches lösen das Problem nicht dauerhaft.',
    impact:
      'Stack-Traces verraten interne Dateipfade, Library-Versionen und Logik-Details an Angreifer. ' +
      'Für DSGVO ist das ein potenzieller Datenschutzverstoß.',
    strategy:
      'Einmalig eine zentrale `handleApiError(err, req)`-Funktion in `src/lib/api-error.ts` erstellen. ' +
      'Alle API-Routes importieren diese Funktion statt direkt zu returnen. ' +
      'Die Funktion loggt den vollen Fehler server-seitig und gibt nur eine generische Nachricht zurück.',
    firstStep:
      'Neue Datei `src/lib/api-error.ts` anlegen:\n' +
      '`export function apiError(err: unknown, code = "INTERNAL_ERROR") { log.error(err); return NextResponse.json({ error: "Ein Fehler ist aufgetreten", code }, { status: 500 }) }`\n' +
      'Dann die betroffenen Routen in einem Durchlauf migrieren.',
    fixApproach: 'central-fix',
  },
  {
    id: 'select-star',
    matchMessagePatterns: [/select \*/i, /SELECT \*/i, /over-fetch/i],
    title: 'SELECT * in API-Routen — explizite Feld-Konstanten einführen',
    problem:
      'Mehrere API-Routen fragen alle Spalten ab (SELECT *). Das führt zu Over-Fetching, ' +
      'verlangsamt Queries und gibt möglicherweise sensible Spalten wie password_hash oder interne ' +
      'Felder an den Client weiter.',
    impact:
      'Jede neue Spalte in der Datenbank landet automatisch in der API-Antwort — ' +
      'das ist ein schleichendes Datenleck ohne bewusste Entscheidung.',
    strategy:
      'Pro Entität eine Konstante mit den erlaubten Feldern definieren: ' +
      '`const USER_PUBLIC_FIELDS = "id, name, email, created_at"`. ' +
      'Alle Queries dieser Entität nutzen diese Konstante. Einmaliger Durchlauf, eine Datei pro Entität.',
    firstStep:
      'Die häufigste Entität identifizieren (z.B. users), eine `USER_PUBLIC_FIELDS`-Konstante in ' +
      '`src/lib/db/fields.ts` anlegen, dann alle betroffenen Queries migrieren.',
    fixApproach: 'central-fix',
  },
  {
    id: 'auth-guard',
    matchRuleIds: ['cat-3-rule-15'],
    matchMessagePatterns: [/auth.*check|missing.*auth|getUser|requireAuth/i],
    title: 'Auth-Checks fehlen — einheitliches Guard-Pattern einführen',
    problem:
      'Nicht alle API-Routen prüfen die Authentifizierung konsistent. Das Problem liegt in fehlendem ' +
      'Muster: jede Route implementiert Auth anders oder gar nicht. Einzelfixes pro Datei schaffen ' +
      'keine strukturelle Verbesserung.',
    impact:
      'Eine einzige ungeschützte Route reicht für unauthentifizierten Zugriff auf Org-Daten.',
    strategy:
      'Eine `getAuthUser()`-Utility in `src/lib/auth/get-auth-user.ts` erstellen die ' +
      'Authentifizierung + Org-ID in einem Aufruf liefert und bei Fehler direkt eine 401-Response ' +
      'wirft. Alle Routes nutzen diese eine Funktion als erste Zeile.',
    firstStep:
      '`src/lib/auth/get-auth-user.ts` anlegen mit `getAuthUser(request)` — ' +
      'gibt `{ user, orgId }` zurück oder wirft `NextResponse.json({ error: "Unauthorized" }, { status: 401 })`. ' +
      'Dann die kritischen (nicht-public) Routes in einem Durchlauf migrieren.',
    fixApproach: 'central-fix',
  },
  {
    id: 'rls-coverage',
    matchRuleIds: ['cat-3-rule-16'],
    matchMessagePatterns: [/RLS|Row Level Security/i],
    title: 'RLS nicht auf allen Tabellen — systematische Migration anlegen',
    problem:
      'Nicht alle Datenbank-Tabellen haben Row Level Security aktiviert. Bei einem Multi-Tenant-System ' +
      'bedeutet das, dass ein Nutzer theoretisch Daten anderer Organisationen lesen kann, ' +
      'wenn der Service Key genutzt wird.',
    impact: 'Verletzung der Mandantentrennung — DSGVO-Risiko und potenzieller Datenleck zwischen Kunden.',
    strategy:
      'Eine Migration anlegen die für jede Tabelle ohne RLS `ENABLE ROW LEVEL SECURITY` und ' +
      'eine `USING (organization_id = get_my_organization_id())`-Policy hinzufügt. ' +
      'Nicht alle auf einmal — eine Tabelle nach der anderen testen.',
    firstStep:
      'Die Tabellen ohne RLS aus den Migrations auflisten. Eine neue Migration anlegen: ' +
      '`ALTER TABLE <table> ENABLE ROW LEVEL SECURITY; CREATE POLICY <name> ON <table> USING (organization_id = get_my_organization_id());`',
    fixApproach: 'config-change',
  },
  {
    id: 'cookie-consent',
    matchRuleIds: ['cat-4-rule-9', 'cat-4-rule-12'],
    matchMessagePatterns: [/cookie.*consent|consent.*management|CMP/i],
    title: 'Cookie Consent fehlt — einmalig CMP installieren',
    problem:
      'Keine Cookie-Consent-Verwaltung vorhanden. Laut ePrivacy-Richtlinie und DSGVO ist Consent ' +
      'vor dem Setzen nicht-essenzieller Cookies Pflicht.',
    impact: 'Bußgeld-Risiko, fehlende Rechtsgrundlage für Analytics und Marketing-Cookies.',
    strategy:
      'Eine Cookie-Consent-Library integrieren (z.B. Cookiebot, Usercentrics oder OSS-Alternative ' +
      'wie `react-cookie-consent`). Einmalige Installation, zentraler Eingriff in `_app.tsx` oder Layout.',
    firstStep:
      '`pnpm add react-cookie-consent` und in `src/app/layout.tsx` den `<CookieConsent>`-Provider ' +
      'einbinden. Analytics-Tags hinter Consent-Gate stellen.',
    fixApproach: 'central-fix',
  },
  {
    id: 'legal-pages',
    matchRuleIds: ['cat-4-rule-7', 'cat-4-rule-11'],
    matchMessagePatterns: [/impressum|datenschutz|privacy.*page|legal.*page/i],
    title: 'Impressum / Datenschutz fehlen — Pflichtseiten anlegen',
    problem:
      'Pflichtseiten (Impressum nach §5 TMG, Datenschutz nach Art. 13 DSGVO) sind nicht vorhanden ' +
      'oder unvollständig. Das ist keine technische, sondern eine rechtliche Lücke.',
    impact: 'Abmahnrisiko, Bußgelder, fehlende DSGVO-Konformität vor erstem Kunden.',
    strategy:
      'Seiten anlegen mit vollständigen Pflichtangaben. Impressum: Betreiber, Adresse, Vertretungsberechtigter. ' +
      'Datenschutz: alle verarbeiteten Kategorien, Rechtsgrundlagen, Auftragsverarbeiter.',
    firstStep:
      '`src/app/(legal)/impressum/page.tsx` und `src/app/(legal)/datenschutz/page.tsx` anlegen. ' +
      'Platzhalter durch echte Betreiber-Daten ersetzen. Footer-Links setzen.',
    fixApproach: 'documentation',
  },
  {
    id: 'empty-catch',
    matchRuleIds: ['cat-2-rule-7'],
    matchMessagePatterns: [/empty.catch|leere.*catch|catch.*block/i],
    title: 'Leere catch-Blöcke — strukturiertes Logging einführen',
    problem:
      'Mehrere catch-Blöcke fangen Fehler ab und ignorieren sie stillschweigend. ' +
      'Das macht Produktionsfehler unsichtbar und erschwert Debugging erheblich.',
    impact: 'Fehler passieren lautlos — Nutzer merken Probleme, das Team sieht keine Logs.',
    strategy:
      'Jeden leeren catch-Block mit mindestens `log.error(err)` befüllen. ' +
      '`createLogger` aus `src/lib/logger.ts` bereits vorhanden — einen Durchlauf ' +
      'durch alle betroffenen Dateien machen.',
    firstStep:
      'Die betroffenen Dateien in einem Git-Commit durchgehen: ' +
      '`catch (err) { log.error("Fehler in X", { err }) }`. ' +
      'Kein Refactoring — nur den Empty-Catch füllen.',
    fixApproach: 'per-file',
  },
  {
    id: 'strict-equality',
    matchRuleIds: ['cat-2-rule-10'],
    matchMessagePatterns: [/strict.*equal|== ohne|!= ohne/i],
    title: '== statt === — Durchlauf mit automatischem Fix',
    problem:
      'Code nutzt `==` und `!=` statt `===` und `!==`. Das führt zu unerwarteten Typ-Koercionen, ' +
      'die in JavaScript schwer zu debuggen sind (z.B. `0 == false` ist `true`).',
    impact:
      'Schwer zu reproduzierende Bugs durch implizite Typumwandlung, ' +
      'besonders bei User-Input-Validierung.',
    strategy:
      'ESLint-Regel `eqeqeq` aktivieren (falls noch nicht aktiv) und einmalig ' +
      '`pnpm exec eslint --fix src/` ausführen. Die meisten Vorkommen sind autofix-fähig.',
    firstStep:
      'In `.eslintrc` die Regel `"eqeqeq": ["error", "always"]` ergänzen, ' +
      'dann `pnpm exec eslint --fix src/` ausführen und den Diff reviewen.',
    fixApproach: 'central-fix',
  },
  {
    id: 'hardcoded-secrets',
    matchMessagePatterns: [/hardcoded.secret|credential.*source|secret.*source.*code/i],
    title: 'Potenzielle Secrets im Code — sofort rotieren und in Env-Vars verschieben',
    problem:
      'Mögliche Secrets, Passwörter oder API-Keys im Quellcode gefunden. ' +
      'Auch in Private-Repos sind Secrets im Code ein kritisches Risiko — ' +
      'sie erscheinen in Git-History, CI-Logs und bei Code-Reviews.',
    impact:
      'Jedes geleakte Secret muss als kompromittiert betrachtet und sofort rotiert werden. ' +
      'Kritisches Sicherheitsrisiko.',
    strategy:
      'Gefundene Werte sofort rotieren (neu generieren beim Provider). ' +
      'In `.env.local` oder Vercel/Supabase Env-Vars verschieben. ' +
      'Niemals Secrets in `.env.local` committen — in `.gitignore` prüfen.',
    firstStep:
      'Die gemeldeten Dateien sofort prüfen. Wenn echte Secrets: Wert beim Provider rotieren, ' +
      'dann in Env-Var verschieben. `git filter-branch` oder BFG Repo Cleaner wenn bereits in History.',
    fixApproach: 'per-file',
  },
  {
    id: 'mass-assignment',
    matchMessagePatterns: [/mass.assignment|req\.body.*insert|req\.body.*update/i],
    title: 'Mass Assignment — Eingaben explizit destrukturieren',
    problem:
      'Datenbank-Operationen erhalten das gesamte Request-Body-Objekt statt explizit ' +
      'ausgewählter Felder. Angreifer können beliebige Felder wie `role` oder `organization_id` ' +
      'über den Request setzen.',
    impact:
      'Privilege Escalation und Tenant-Isolation-Bypass durch einfaches Hinzufügen ' +
      'von Feldern im Request.',
    strategy:
      'Jede betroffene Route destrukturiert explizit: ' +
      '`const { name, bio } = await req.json()` statt `const data = await req.json()`. ' +
      'Zod-Schema hinzufügen das nur erlaubte Felder durchlässt.',
    firstStep:
      'Die betroffenen Routen identifizieren. Für jede Route: ein Zod-Schema definieren ' +
      'und `validateBody(schema, request)` aus `src/lib/validators` nutzen.',
    fixApproach: 'per-file',
  },
  {
    id: 'localstorage-token',
    matchMessagePatterns: [/localStorage.*token|token.*localStorage/i],
    title: 'Auth-Tokens in localStorage — Supabase SSR-Client verwenden',
    problem:
      'Auth-Tokens werden in localStorage gespeichert. Das macht sie für jeden JavaScript-Code ' +
      '(auch injiziertes XSS-Script) lesbar. localStorage bietet keinen Same-Site-Schutz.',
    impact:
      'Jede XSS-Schwachstelle kann Auth-Tokens stehlen und Session-Hijacking ermöglichen.',
    strategy:
      'Supabase SSR-Client aus `@supabase/ssr` verwenden — dieser speichert Tokens ' +
      'automatisch in httpOnly-Cookies. Kein manuelles Token-Management nötig.',
    firstStep:
      'Supabase-Client-Initialisierung auf `@supabase/ssr` umstellen. ' +
      'Manuelles `localStorage.setItem(token, ...)` entfernen. ' +
      'Supabase übernimmt Cookie-Verwaltung automatisch.',
    fixApproach: 'central-fix',
  },
  {
    id: 'math-random',
    matchMessagePatterns: [/Math\.random|math-random/i],
    title: 'Math.random() für sicherheitskritische Werte — crypto.randomUUID() nutzen',
    problem:
      'Math.random() ist deterministisch und nicht kryptografisch sicher. ' +
      'Für Tokens, Session-IDs oder Nonces sind die generierten Werte vorhersagbar.',
    impact: 'Vorhersagbare Tokens können erraten werden — Session-Hijacking oder CSRF möglich.',
    strategy:
      'Alle Vorkommen von Math.random() die sicherheitsrelevante Werte erzeugen durch ' +
      '`crypto.randomUUID()` (für IDs) oder `crypto.getRandomValues()` (für Byte-Arrays) ersetzen.',
    firstStep:
      'Die gemeldeten Stellen prüfen: Ist der Wert sicherheitskritisch (Token, Nonce, ID)? ' +
      'Wenn ja: durch `crypto.randomUUID()` ersetzen. Math.random() bleibt ok für UI-Effekte.',
    fixApproach: 'per-file',
  },
  {
    id: 'accessibility-a11y',
    matchRuleIds: ['cat-16-rule-10'],
    matchMessagePatterns: [/alt.*text|img.*alt|a11y|accessibility|aria/i],
    title: 'Barrierefreiheit — Image Alt-Texte und ARIA systematisch ergänzen',
    problem:
      'Bilder ohne Alt-Text und fehlende ARIA-Attribute machen die Anwendung für ' +
      'Screenreader-Nutzer unverwendbar. Das ist sowohl BFSG-Pflicht als auch ' +
      'schlechte UX für ~20% der Nutzer.',
    impact:
      'BFSG-Konformität verfehlt, SEO-Nachteile, rechtliches Risiko ab 2025 für B2G-Angebote.',
    strategy:
      'Einen Accessibility-Durchlauf planen: alle `<img>`-Tags mit aussagekräftigen `alt`-Attributen ' +
      'versehen. Dekorative Bilder erhalten `alt=""`. Dann axe-core installieren für kontinuierliche Prüfung.',
    firstStep:
      '`pnpm add -D @axe-core/react` installieren. ' +
      'Die betroffenen TSX-Dateien in einem Durchlauf mit Alt-Texten versehen. ' +
      'Für dekorative Bilder: `alt=""` ist korrekt und absichtlich leer.',
    fixApproach: 'per-file',
  },
  {
    id: 'prompt-injection',
    matchRuleIds: ['cat-22-rule-5'],
    matchMessagePatterns: [/prompt.injection|system.*prompt|system-prompt/i],
    title: 'Prompt Injection — System-Prompts statisch halten',
    problem:
      'User-Input wird in System-Prompts interpoliert. Das ermöglicht Prompt Injection: ' +
      'Nutzer können AI-Anweisungen überschreiben, System-Prompts exfiltrieren ' +
      'oder das Modell zu verbotenem Verhalten bringen.',
    impact:
      'Kritisches AI-Sicherheitsrisiko — kein anderer Exploit ist so leicht durchzuführen ' +
      'und so schwer zu erkennen.',
    strategy:
      'System-Prompts müssen vollständig statische Strings sein. ' +
      'User-Input kommt ausschließlich in den "user"-Role-Nachrichten. ' +
      'Keine Template-Literale mit `${userInput}` im "system"-Role.',
    firstStep:
      'Die betroffenen Dateien identifizieren. System-Prompt-String in eine Konstante extrahieren. ' +
      'User-Kontext (Org-Name, Workspace-Name etc.) als separate "user"-Nachricht senden, ' +
      'nicht in den System-Prompt interpolieren.',
    fixApproach: 'per-file',
  },
  {
    id: 'rate-limiting',
    matchRuleIds: ['cat-3-rule-17'],
    matchMessagePatterns: [/rate.limit|ratelimit/i],
    title: 'Rate Limiting nicht konfiguriert — @upstash/ratelimit einbinden',
    problem:
      'Öffentliche API-Endpunkte haben kein Rate Limiting. Das macht sie anfällig für ' +
      'Brute-Force-Angriffe, Credential-Stuffing und DoS durch übermäßige Anfragen.',
    impact: 'Budget-Ausschöpfung durch missbräuchliche Nutzung, Service-Downtime, AI-Kosten-Explosion.',
    strategy:
      'Einmalig `@upstash/ratelimit` + Upstash Redis einrichten. Rate Limiter in ' +
      '`src/middleware.ts` oder einem zentralen Proxy wired — ein Eingriff schützt alle Routes.',
    firstStep:
      '`pnpm add @upstash/ratelimit @upstash/redis`. Upstash Redis-Instanz anlegen (kostenlos). ' +
      'In `src/lib/ratelimit/index.ts` den Limiter konfigurieren und in `middleware.ts` wired.',
    fixApproach: 'central-fix',
  },
  {
    id: 'idor-check',
    matchMessagePatterns: [/IDOR|idor-missing-org|organization_id.*check/i],
    title: 'IDOR-Risiko — organization_id-Filter in allen Queries ergänzen',
    problem:
      'DB-Queries filtern nur nach Resource-ID ohne `organization_id`-Prüfung. ' +
      'Ein authentifizierter Nutzer einer Organisation kann so Ressourcen anderer Organisationen ' +
      'abrufen, indem er IDs errät.',
    impact: 'Tenant-Isolation verletzt — Datenleck zwischen Kunden. Kritisches Sicherheitsrisiko.',
    strategy:
      'Jede Query die nach einer Ressource-ID filtert, muss auch `.eq("organization_id", orgId)` enthalten. ' +
      '`orgId` kommt immer aus dem authentifizierten User-Context, nie aus dem Request-Body.',
    firstStep:
      'Die gemeldeten Routes nacheinander öffnen und `.eq("organization_id", orgId)` ' +
      'zu jedem `.select()`, `.update()`, `.delete()` hinzufügen. ' +
      '`orgId` aus `getAuthUser()` beziehen.',
    fixApproach: 'per-file',
  },
]

/**
 * Find the best matching recommendation for a finding group.
 * Matches by ruleId first (exact), then by message pattern.
 */
export function findRecommendation(
  ruleId: string,
  message: string,
): FindingRecommendation | null {
  // 1. Exact ruleId match
  const byRule = FINDING_RECOMMENDATIONS.find((r) =>
    r.matchRuleIds?.includes(ruleId)
  )
  if (byRule) return byRule

  // 2. Message pattern match
  const byMessage = FINDING_RECOMMENDATIONS.find((r) =>
    r.matchMessagePatterns?.some((p) => p.test(message))
  )
  return byMessage ?? null
}

export const FIX_APPROACH_LABEL: Record<FixApproach, string> = {
  'central-fix':    'Zentrale Lösung',
  'per-file':       'Pro Datei',
  'config-change':  'Konfiguration',
  'documentation':  'Dokumentation',
}

export const FIX_APPROACH_COLOR: Record<FixApproach, { bg: string; color: string }> = {
  'central-fix':   { bg: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' },
  'per-file':      { bg: 'color-mix(in srgb, var(--text-secondary) 12%, transparent)', color: 'var(--text-secondary)' },
  'config-change': { bg: 'color-mix(in srgb, var(--accent) 8%, transparent)', color: 'var(--accent)' },
  'documentation': { bg: 'var(--border)', color: 'var(--text-tertiary)' },
}
