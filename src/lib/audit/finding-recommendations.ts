// src/lib/audit/finding-recommendations.ts
// Static strategy recommendations per finding type.
// No LLM calls — written once, reused on every audit.

export type FixApproach = 'central-fix' | 'per-file' | 'config-change' | 'documentation'

export interface ManualCodeSnippet {
  code: string
  /** Name of the tool where this should be executed, e.g. "Supabase SQL Editor" */
  tool: string
  language?: string
}

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
  /**
   * For fixType='manual' findings only.
   * When present, the UI renders a numbered step checklist instead of the firstStep monospace block.
   */
  manualSteps?: string[]
  /** Criterion the user can check to know they are done. Shown below the steps. */
  verification?: string
  /** Optional code/SQL/command snippets to copy into a specific tool. */
  codeSnippets?: ManualCodeSnippet[]
}

export const FINDING_RECOMMENDATIONS: FindingRecommendation[] = [
  {
    id: 'architecture-agent-summary',
    matchRuleIds: ['architecture'],
    title: 'Architektur-Agent: God Components zusammengefasst — Details in den Einzelfindings',
    problem:
      'Der Architektur-Agent hat mehrere Dateien mit übermäßiger Komplexität identifiziert. ' +
      'Diese Zusammenfassung ergänzt die konkreten Einzelfindings (cat-1-rule-10) weiter unten in der Liste — ' +
      'dort sind alle betroffenen Dateien einzeln aufgeführt.',
    impact:
      'God Components sind der häufigste Auslöser für Regressions beim Refactoring — ' +
      'zu viele Abhängigkeiten, zu viele Side Effects in einer Datei.',
    strategy:
      'Die konkreten Einzelfindings weiter unten bearbeiten. ' +
      'Die schlimmsten Dateien zuerst: > 500 Zeilen oder > 10 Hooks sind Priorität 1.',
    firstStep:
      'Nach unten scrollen zu "God Components aufteilen" und mit der längsten gemeldeten Datei beginnen.',
    fixApproach: 'per-file',
  },
  {
    id: 'performance-agent-summary',
    matchRuleIds: ['performance'],
    title: 'Performance: Unnötige Re-Renders durch Komponenten-Vereinfachung reduzieren',
    problem:
      'Der Performance-Agent meldet, dass Komponenten mit vielen Hooks und State-Variablen ' +
      'unnötige Re-Renders verursachen. Zu viel lokaler State ohne Memoization führt dazu, ' +
      'dass Kindkomponenten bei jeder Eltern-Änderung neu rendern.',
    impact:
      'Sichtbare UI-Verzögerungen bei interaktiven Elementen, unnötige API-Calls durch ' +
      'Effekte die zu oft feuern, schlechte Core Web Vitals.',
    strategy:
      'State konsolidieren: zusammengehörige useState-Calls zu einem useReducer zusammenfassen. ' +
      'Teure Berechnungen mit useMemo absichern. Stabile Callback-Referenzen mit useCallback.',
    firstStep:
      'Die größte Komponente mit den meisten useState-Calls öffnen. ' +
      'Alle zusammengehörigen Zustände (z.B. loading + error + data) zu einem useReducer zusammenfassen.',
    fixApproach: 'per-file',
  },
  {
    id: 'god-component',
    matchRuleIds: ['cat-1-rule-10'],
    matchMessagePatterns: [/god.component|large.component.*hook/i],
    title: 'God Components — zu viel auf einmal. Custom Hooks schaffen Ordnung.',
    problem:
      'Einzelne Komponenten übernehmen zu viele Verantwortlichkeiten: Datenladen, Geschäftslogik, ' +
      'Darstellung und State-Management in einer Datei. Das macht Tests, Reviews und Refactorings ' +
      'unverhältnismäßig aufwändig.',
    impact:
      'God Components sind der häufigste Auslöser für Regressions beim Refactoring — ' +
      'zu viele Abhängigkeiten, zu viele Side Effects in einer Datei.',
    strategy:
      'Jede God Component nach Verantwortung aufteilen: Datenladen → Custom Hook, ' +
      'Darstellung → Sub-Komponente, Geschäftslogik → Utility. ' +
      'Ziel: < 300 Zeilen, < 5 Hooks pro Datei.',
    firstStep:
      'Die größte Komponente öffnen und alle `useEffect`/`useState`-Blöcke identifizieren. ' +
      'Den ersten zusammenhängenden Block in einen Custom Hook (`use*.ts`) extrahieren.',
    fixApproach: 'per-file',
  },
  {
    id: 'component-size',
    matchRuleIds: ['cat-25-rule-2'],
    matchMessagePatterns: [/component.*has \d+ lines|component.*zu lang/i],
    title: 'Komponenten zu groß — ein Extract-Hook, und das Problem schrumpft.',
    problem:
      'Einzelne React-Komponenten überschreiten die Grenzwerte (>300 Zeilen Warnung, >500 Zeilen Verletzung). ' +
      'Zu große Komponenten mischen Datenladen, State-Management und Darstellung in einer Datei — ' +
      'das erzeugt enge Kopplung und erschwert isolierte Tests.',
    impact:
      'Große Komponenten sind der häufigste Auslöser für ungewollte Re-Renders und Regressions. ' +
      'Jede Zeile mehr erhöht die kognitive Last bei Code-Reviews und macht Wiederverwendung schwieriger.',
    strategy:
      'Verantwortlichkeiten aufteilen: Datenladen und State → Custom Hook (`use*.ts`), ' +
      'wiederverwendbare Abschnitte → Sub-Komponenten, komplexe Berechnungen → Utility-Funktionen. ' +
      'Ziel: <300 Zeilen pro Datei, max. 5 Hooks pro Komponente.',
    firstStep:
      'Die längste Komponente öffnen und alle `useEffect`/`useState`-Blöcke auflisten. ' +
      'Den ersten logisch zusammenhängenden Block in einen Custom Hook auslagern — ein Commit pro Extraktion.',
    fixApproach: 'per-file',
  },
  {
    id: 'file-size',
    matchRuleIds: ['cat-1-rule-4'],
    matchMessagePatterns: [/file size (violation|warning)|has \d+ lines \(limit/i, /zu (lang|viel|gross)/i],
    title: 'Dateien über 500 Zeilen — hier staut sich Tech Debt. Zeit für eine Trennung.',
    problem:
      'Mehrere Dateien überschreiten die Grenzwerte: >300 Zeilen ist eine Warnung, >500 Zeilen eine Verletzung. ' +
      'Große Dateien haben zu viele Verantwortlichkeiten, sind schwerer zu testen und erhöhen die kognitive Last. ' +
      'Einzelfixes helfen nicht — das Problem ist strukturell.',
    impact:
      'Dateien über 500 Zeilen sind ein aktives Risiko für Merge-Konflikte und Regressions beim Refactoring. ' +
      'Dateien zwischen 300 und 500 Zeilen sind Warnzeichen — sie wachsen, wenn nichts geändert wird.',
    strategy:
      'Einen Durchlauf planen: jede betroffene Datei nach Verantwortung aufteilen. ' +
      'Typische Splits: Hook/Logik extrahieren, Sub-Komponenten auslagern, ' +
      'Helper-Funktionen in eigene Utils verschieben. Commit pro Datei.',
    firstStep:
      'Mit den >500-Zeilen-Dateien beginnen (Verletzungen). Verantwortlichkeiten identifizieren, ' +
      'dann je eine Verantwortung in eine neue Datei extrahieren. Ziel: < 300 Zeilen pro Datei.',
    fixApproach: 'per-file',
  },
  {
    id: 'error-leakage',
    matchRuleIds: ['cat-3-rule-19'],
    matchMessagePatterns: [/stack.trace|error.*leak|error.*intern/i, /stack-trace-response/i],
    title: 'Stack-Traces in API-Responses — das gibt Angreifern Einblick. Einmal fixen, überall sicher.',
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
    title: 'SELECT * in API-Routen — jede neue Spalte landet automatisch in der Response. Einmal aufräumen.',
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
    title: 'Auth-Checks fehlen — eine ungeschützte Route reicht. Guard-Pattern löst das strukturell.',
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
    title: 'RLS fehlt auf Tabellen — ein Tenant liest die Daten des anderen. Migration anlegen.',
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
    title: '[DSGVO] Cookie Consent fehlt — einmalig eine CMP installieren, dann erledigt.',
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
    title: '[Rechtspflicht] Impressum / Datenschutz fehlen — das ist keine Option.',
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
    title: 'Leere catch-Blöcke schlucken Fehler. Kein Log = kein Monitoring.',
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
  {
    id: 'schema-drift',
    matchRuleIds: ['cat-5-schema-drift'],
    matchMessagePatterns: [/schema.drift|live.check|live-check|drift.check/i],
    title: 'Schema Drift Check — Live-DB mit Code vergleichen',
    problem:
      'Dieser Scan analysiert deinen Quellcode — nicht deine Live-Datenbank. ' +
      'Änderungen die direkt über Provider-Dashboards gemacht wurden (Supabase Studio, Neon Console etc.) ' +
      'sind im Code nicht sichtbar. Besonders kritisch: RLS-Policies, Indexes, Permissions ' +
      'und manuell erstellte oder gelöschte Tabellen.',
    impact:
      'Der Audit-Score kann "Stable" anzeigen während deine Live-DB kritische Sicherheitslücken hat — ' +
      'z.B. fehlende RLS-Policies oder falsch konfigurierte Permissions, die nur im Dashboard gesetzt wurden.',
    strategy:
      'Den Schema Drift Check regelmäßig ausführen (vor jedem Release) um Live-DB und Code synchron zu halten. ' +
      'Langfristig: alle DB-Änderungen ausschließlich über Migrations-Dateien durchführen — nie direkt über das Dashboard.',
    firstStep:
      'SQL-Queries aus dem Finding in deinem Datenbank-Dashboard ausführen und Ergebnisse mit Migrations-Dateien vergleichen.',
    fixApproach: 'config-change',
    manualSteps: [
      'Supabase Dashboard öffnen → dein Projekt → SQL Editor',
      'Die SQL-Queries aus dem Finding-Kasten unten in den Editor kopieren und ausführen',
      'Ergebnisse mit deinen Migrations-Dateien in supabase/migrations/ vergleichen',
      'Jede Abweichung als neue Migration erfassen: supabase/migrations/<timestamp>_fix_drift.sql',
      'Migration deployen: supabase db push',
    ],
    verification: 'Alle SQL-Queries liefern leere Ergebnisse — kein Drift mehr vorhanden. Migrations-Dateien und Live-DB sind synchron.',
  },
  {
    id: 'pitr-restore-test',
    matchRuleIds: ['cat-13-rule-7'],
    matchMessagePatterns: [/restore.test.*not.*document|backup.*not.*verif/i],
    title: 'Restore-Test — Backup manuell verifizieren',
    problem:
      'Ein ungetestetes Backup ist kein Backup. Der Restore-Prozess muss mindestens einmal manuell durchgespielt ' +
      'worden sein bevor du einem Kunden RTO < 4h zusicherst. Nur dann kannst du sicher sein, ' +
      'dass im Ernstfall keine unerwarteten Hürden auftauchen.',
    impact:
      'Ohne Restore-Test gibt es keine Garantie, dass das Backup vollständig und korrekt ist. ' +
      'Provider-Backups scheitern gelegentlich still — ein fehlgeschlagener Restore kostet Stunden ' +
      'oder führt zu dauerhaftem Datenverlust.',
    strategy:
      'Einmaliger Restore-Test in ein separates Testprojekt. Ergebnis dokumentieren. ' +
      'Danach jährlich wiederholen und Datum im Runbook aktualisieren.',
    firstStep:
      'Supabase Dashboard → Projekt → Database → Backups → Point in Time Recovery → Test-Restore in separates Projekt.',
    fixApproach: 'documentation',
    manualSteps: [
      'supabase.com öffnen → dein Projekt → Database → Backups',
      '"Point in Time Recovery" wählen',
      'Zeitstempel ~1 Stunde in der Vergangenheit auswählen',
      'In ein separates Testprojekt restoren — NICHT das Produktionsprojekt überschreiben',
      'Im Testprojekt ausführen: SELECT COUNT(*) FROM users — Ergebnis mit Produktion vergleichen',
      'Datum + Ergebnis in docs/runbooks/disaster-recovery.md eintragen (TODO-Zeile)',
    ],
    verification: 'Die TODO-Zeile in docs/runbooks/disaster-recovery.md ist ausgefüllt: Datum, Testergebnis, Anzahl Rows.',
  },


  // ── Security (DB + Network) (added 2026-04-29) ─────────────────────────────────────────
  // ─── OWASP + Input-Validierung ────────────────────────────────────────────
    {
      id: 'owasp-top10',
      matchRuleIds: ['cat-3-rule-1'],
      matchMessagePatterns: [/OWASP|owasp/i],
      title: 'OWASP Top 10 — Checkliste einmalig durchgehen',
      problem:
        'Das Projekt wurde noch nicht systematisch gegen die OWASP Top 10 geprüft. ' +
        'Injection, Broken Auth, Security Misconfiguration — das sind keine akademischen Risiken, ' +
        'das sind die häufigsten Angriffsvektoren auf reale Produktions-Apps.',
      impact:
        'Unbekannte Schwachstellen bleiben unsichtbar bis ein Angreifer sie findet. ' +
        'Ohne strukturierte Prüfung gibt es keine Garantie, dass die kritischsten Klassen abgedeckt sind.',
      strategy:
        'Einmaligen OWASP-Durchlauf als Sprint planen: jede der 10 Kategorien gegen die eigene Codebasis prüfen. ' +
        'Ergebnis: eine kurze Checkliste mit Status (geprüft / offen / nicht zutreffend) in docs/security/owasp-checklist.md.',
      firstStep:
        "Cursor-Prompt: 'Erstelle docs/security/owasp-checklist.md mit den OWASP Top 10 (2021). " +
        "Für jede Kategorie: kurze Definition, Relevanz für dieses Next.js/Supabase-Projekt, " +
        "und Spalten Status (offen/geprüft/n.a.) + Notizen.'",
      fixApproach: 'documentation',
      manualSteps: [
        'docs/security/owasp-checklist.md anlegen (Cursor-Prompt oben nutzen)',
        'Jede der 10 Kategorien kurz gegen den eigenen Code prüfen — 30 Minuten reichen für einen ersten Durchlauf',
        'Status setzen: geprüft / offen / nicht zutreffend',
        'Offene Punkte als Finding-Tasks anlegen oder in den nächsten Sprint einplanen',
      ],
      verification:
        'docs/security/owasp-checklist.md existiert, alle 10 Kategorien haben einen Status-Eintrag, keine "offen"-Einträge ohne Kommentar.',
    },
    {
      id: 'input-validation',
      matchRuleIds: ['cat-3-rule-2'],
      matchMessagePatterns: [/input.*validier|validier.*input|validateBody|zod.*schema/i],
      title: 'Serverseitige Input-Validierung fehlt — Zod-Schema vor jede Business-Logik',
      problem:
        'API-Routen akzeptieren User-Input ohne serverseitige Validierung. ' +
        'Das ist die Einladung für Injection-Angriffe, unerwartete Datentypen und Mass-Assignment. ' +
        'Client-seitige Validierung reicht nicht — jeder HTTP-Client umgeht sie.',
      impact:
        'Ein einziger böswilliger Request kann Daten korrumpieren, Datenbank-Queries manipulieren ' +
        'oder interne Fehler auslösen die Stack-Traces zurückgeben.',
      strategy:
        'Zod-Schemas für alle API-Route-Inputs, vor jeder Business-Logik. ' +
        'Einmal zentral definiert in src/lib/validators/, überall importiert. ' +
        'GET-Routen ohne Body brauchen nur Query-Param-Validierung.',
      firstStep:
        "Cursor-Prompt: 'Füge in jede POST/PUT/PATCH-Route in src/app/api/ ein Zod-Schema für den " +
        "Request-Body ein. Schema: z.object({...}) mit allen erwarteten Feldern und Typen. " +
        "Parse vor der Business-Logik: const parsed = schema.safeParse(await req.json()); " +
        "if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }).'",
      fixApproach: 'per-file',
      verification:
        'Jede POST/PUT/PATCH-Route hat ein z.safeParse() oder z.parse() als erste Zeile nach dem Auth-Check.',
    },
  
    // ─── Secrets im Repo (gitleaks) ───────────────────────────────────────────
    {
      id: 'secrets-in-repo',
      matchRuleIds: ['cat-3-rule-3'],
      matchMessagePatterns: [/gitleaks|secret.*scan|secret.*repo|git.*secret/i],
      title: 'Secrets-Scan (gitleaks) — einmalig laufen lassen, dann in CI',
      problem:
        'Kein automatisierter Scan nach Secrets in der Git-History. ' +
        'API-Keys und Tokens tauchen in der Praxis regelmäßig in Commits auf — ' +
        'auch in Private-Repos ein kritisches Risiko sobald ein Entwickler-Gerät kompromittiert wird.',
      impact:
        'Secrets in der Git-History sind permanent — ein `git push` genügt damit sie für jeden ' +
        'mit Repo-Zugriff sichtbar sind. Rotation allein reicht nicht wenn der Key noch in History steht.',
      strategy:
        'Einmalig gitleaks gegen die vollständige Git-History laufen lassen. ' +
        'Echte Funde: Wert rotieren + History mit BFG Repo Cleaner bereinigen. ' +
        'Dann: gitleaks als pre-commit Hook oder CI-Step dauerhaft einbinden.',
      firstStep:
        '`pnpm exec gitleaks detect --source . --log-level warn` ausführen. ' +
        'Falls nicht installiert: `winget install gitleaks` oder `brew install gitleaks`. ' +
        'Ausgabe prüfen — false positives über .gitleaks.toml allowlist ausschließen.',
      fixApproach: 'config-change',
      manualSteps: [
        'gitleaks installieren: winget install gitleaks (Windows) oder brew install gitleaks (Mac)',
        'Scan ausführen: gitleaks detect --source . --log-level warn',
        'Echte Funde: Wert beim Provider rotieren (neuen API-Key generieren)',
        'History bereinigen: BFG Repo Cleaner oder git filter-repo',
        '.gitleaks.toml anlegen für bekannte false positives (Test-Daten, Beispiel-Keys)',
        'Pre-commit Hook ergänzen oder gitleaks in CI-Pipeline einbinden',
      ],
      verification:
        'gitleaks detect gibt 0 echte Findings zurück. .gitleaks.toml ist vorhanden und versioniert.',
    },
  
    // ─── npm audit ────────────────────────────────────────────────────────────
    {
      id: 'npm-audit',
      matchRuleIds: ['cat-3-rule-7'],
      matchMessagePatterns: [/npm audit|dependency.*vuln|CVE|pnpm audit/i],
      title: 'Dependency-Vulnerabilities — pnpm audit jetzt ausführen',
      problem:
        'Abhängigkeiten mit bekannten Sicherheitslücken (CVEs) sind ein häufig unterschätztes Risiko. ' +
        'Npm-Packages werden regelmäßig mit neuen Schwachstellen bekannt — oft lange nach dem ersten Install. ' +
        'Kein Audit-Prozess bedeutet: du weißt nicht, was du trägst.',
      impact:
        'Kritische CVEs in transitiven Dependencies können Angreifern Server-Zugriff, ' +
        'Daten-Exfiltration oder Denial-of-Service ermöglichen — ohne eine einzige Zeile eigenen Code.',
      strategy:
        'Sofort: `pnpm audit` ausführen und kritische + high-severity CVEs beheben. ' +
        'Danach: `pnpm audit` als wöchentlicher Cron oder als CI-Step der bei kritischen CVEs fehlschlägt.',
      firstStep:
        '`pnpm audit --audit-level high` ausführen. ' +
        'Kritische Funde: `pnpm update <paket>` oder `pnpm audit --fix`. ' +
        'Nicht-fixbare Funde mit Begründung in docs/security/known-vulnerabilities.md dokumentieren.',
      fixApproach: 'config-change',
      verification:
        '`pnpm audit --audit-level high` gibt 0 Findings zurück. ' +
        'Oder: alle verbleibenden high/critical CVEs sind in known-vulnerabilities.md mit Begründung dokumentiert.',
    },
  
    // ─── CORS Wildcard-Origin ─────────────────────────────────────────────────
    {
      id: 'cors-wildcard',
      matchRuleIds: ['cat-3-rule-18'],
      matchMessagePatterns: [/CORS|cors.*wildcard|\*.*origin|Access-Control-Allow-Origin.*\*/i],
      title: 'CORS Wildcard-Origin — konkrete Allowlist setzen',
      problem:
        'API-Routen antworten mit `Access-Control-Allow-Origin: *`. ' +
        'Das erlaubt jeder Domain Requests zu stellen — inklusive bösartiger Webseiten. ' +
        'Bei einer SaaS-App mit Auth ist das eine unnötige Angriffsfläche.',
      impact:
        'Ohne CORS-Einschränkung können Cross-Site-Request-Forgery-Angriffe einfacher durchgeführt werden. ' +
        'Sensible Endpunkte sind von beliebigen Domains ansprechbar.',
      strategy:
        'Concrete Origins in einer Allowlist definieren: eigene Domain + ggf. localhost für Development. ' +
        'Zentral in next.config.js oder Middleware konfigurieren — nicht pro Route.',
      firstStep:
        "Cursor-Prompt: 'Prüfe alle API-Routen in src/app/api/ auf CORS-Headers. " +
        "Ersetze Access-Control-Allow-Origin: * durch eine konkrete Allowlist. " +
        "Allowlist: [process.env.NEXT_PUBLIC_APP_URL, \"http://localhost:3000\"]. " +
        "Implementiere in src/lib/cors.ts eine withCors(handler, options?)-Utility " +
        "die den Origin-Header gegen die Allowlist prüft.'",
      fixApproach: 'central-fix',
      verification:
        'Kein `Access-Control-Allow-Origin: *` in API-Routes. ' +
        'CORS-Utility in src/lib/cors.ts vorhanden und von allen öffentlichen API-Routen genutzt.',
    },
  
    // ─── Injection + unsichere Auth-Pattern ───────────────────────────────────
    {
      id: 'injection-patterns',
      matchRuleIds: ['cat-3-rule-20'],
      matchMessagePatterns: [/SQL.*inject|inject.*SQL|string.*concat.*query|template.*literal.*sql/i],
      title: 'SQL/NoSQL-Injection — niemals Strings konkatenieren, immer parametrisiert',
      problem:
        'Query-Strings werden durch String-Konkatenation oder Template-Literale mit User-Input zusammengebaut. ' +
        'Das ist die klassische SQL-Injection — und bei Supabase genauso relevant wie bei jeder anderen DB. ' +
        'Ein einziger ungeprüfter Wert reicht.',
      impact:
        'SQL-Injection ermöglicht vollständigen Datenbankzugriff: Auslesen, Überschreiben, Löschen — ' +
        'über Tenant-Grenzen hinweg. Kritischste Schwachstellenklasse im Web.',
      strategy:
        'Alle DB-Queries über Supabase Query Builder mit parametrisierten Werten. ' +
        'Kein `sql.raw()` mit User-Input. Kein `.rpc()` mit Template-Literals. ' +
        'User-Input kommt ausschließlich als gebundener Parameter.',
      firstStep:
        "Cursor-Prompt: 'Durchsuche src/app/api/ und src/lib/ nach Strings wie " +
        '`${`, sql.raw, oder .rpc( in Kombination mit User-Input-Variablen. ' +
        "Ersetze durch parametrisierte Supabase-Queries: .eq(), .filter(), .insert({...}). " +
        "Kein String mit User-Werten darf direkt in eine Query-Methode fließen.'",
      fixApproach: 'per-file',
      verification:
        'Kein Vorkommen von String-Konkatenation mit User-Input in DB-Queries. ' +
        'Alle Werte fließen als Parameter in Supabase Query Builder-Methoden.',
    },
    {
      id: 'insecure-auth-patterns',
      matchRuleIds: ['cat-3-rule-21'],
      matchMessagePatterns: [/jwt.*verify|token.*check|auth.*bypass|weak.*auth|broken.*auth/i],
      title: 'Unsichere Auth-Pattern — Token-Prüfung auf den Server verlagern',
      problem:
        'Auth-Logik läuft teilweise client-seitig oder nutzt unsichere Muster wie ungeprüfte JWTs. ' +
        'Client-seitige Auth-Checks sind reine UX — kein Sicherheitsmerkmal. ' +
        'Jeder Angreifer kann Client-Code überspringen.',
      impact:
        'Falsches Auth-Vertrauen führt zu Bypasses: Ein Angreifer ruft die API direkt auf ' +
        'ohne die UI-Guards zu passieren.',
      strategy:
        'Auth-Prüfung ausschließlich server-seitig über Supabase SSR-Client. ' +
        'Kein manuelles JWT-Decoding oder -Verifizieren — das übernimmt Supabase. ' +
        '`getAuthUser()` als erste Zeile in jeder geschützten API-Route.',
      firstStep:
        "Cursor-Prompt: 'Prüfe alle API-Routen in src/app/api/ ob sie getAuthUser() oder " +
        "äquivalenten Supabase-Auth-Check als erste Zeile nach dem Request-Parsing haben. " +
        "Entferne manuelles JWT-Decoding (jwt.verify, atob(token), token.split(\".\")). " +
        "Nutze ausschließlich supabase.auth.getUser() server-seitig.'",
      fixApproach: 'per-file',
      verification:
        'Kein manuelles JWT-Parsing im Code. ' +
        'Alle geschützten Routen rufen getAuthUser() oder supabase.auth.getUser() als ersten Auth-Check auf.',
    },
  
    // ─── Data Exposure ─────────────────────────────────────────────────────────
    {
      id: 'data-exposure',
      matchRuleIds: ['cat-3-rule-22'],
      matchMessagePatterns: [/debug.*response|stack.*trace|over.fetch|error.*message.*client/i],
      title: 'Data Exposure — Debug-Infos, Stack-Traces und Over-Fetch aus Responses entfernen',
      problem:
        'API-Responses enthalten mehr als der Client braucht: interne Fehlermeldungen, Stack-Traces, ' +
        'oder ganze DB-Rows statt selektierter Felder. Jede zusätzliche Information ist ein potenzielles Leck.',
      impact:
        'Stack-Traces verraten Dateipfade und Library-Versionen. Over-Fetch gibt Daten preis ' +
        'die der Client nicht sehen sollte (interne Felder, andere User-Daten, Preise etc.).',
      strategy:
        'Drei Schritte: (1) Zentrale apiError()-Funktion für Fehlermeldungen — kein error.stack im Response. ' +
        '(2) Explizite Feld-Selektion in allen DB-Queries statt SELECT *. ' +
        '(3) Response-Typen definieren die exakt die erlaubten Felder listen.',
      firstStep:
        "Cursor-Prompt: 'Erstelle src/lib/api-error.ts mit " +
        "`export function apiError(err: unknown, code = 'INTERNAL_ERROR') { " +
        "if (process.env.NODE_ENV !== 'production') console.error(err); " +
        "return NextResponse.json({ error: 'Ein Fehler ist aufgetreten', code }, { status: 500 }) }`. " +
        "Ersetze in allen API-Routen direkte error.message/error.stack-Returns durch apiError().'",
      fixApproach: 'central-fix',
      verification:
        'Kein `error.stack` oder `error.message` in NextResponse.json()-Aufrufen. ' +
        'src/lib/api-error.ts existiert und wird von allen Routen genutzt.',
    },
  
    // ─── Supabase DB Security ──────────────────────────────────────────────────
    {
      id: 'rls-user-tables',
      matchRuleIds: ['sec-db-01'],
      matchMessagePatterns: [/RLS.*user.*table|user.*table.*RLS|row.*level.*security.*missing/i],
      title: 'RLS auf User-Daten-Tabellen fehlt — Migration anlegen, sofort',
      problem:
        'Tabellen mit User-Daten haben keine Row Level Security. ' +
        'In einem Multi-Tenant-System bedeutet das: jeder authentifizierte User kann potenziell ' +
        'alle Rows lesen wenn der Query keinen expliziten org-Filter hat — und das wird vergessen.',
      impact:
        'Tenant-Isolation verletzt — DSGVO-Risiko und kritischer Datenleck zwischen Kunden. ' +
        'Ein fehlender `.eq("organization_id", orgId)` reicht für einen vollständigen Datenleck.',
      strategy:
        'RLS auf allen Tabellen mit User-Daten aktivieren. ' +
        'Policy: `USING (organization_id = get_my_organization_id())`. ' +
        'Schrittweise Migration: eine Tabelle nach der anderen, nach jedem Schritt testen.',
      firstStep:
        'In Supabase SQL Editor ausführen: ' +
        '`SELECT tablename FROM pg_tables WHERE schemaname = \'public\' ' +
        'AND tablename NOT IN (SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = \'public\');` ' +
        '— gibt alle Tabellen ohne RLS-Policies zurück. ' +
        'Für jede gefundene Tabelle: Migration mit ENABLE ROW LEVEL SECURITY + Policy anlegen.',
      fixApproach: 'config-change',
      manualSteps: [
        'Supabase Dashboard → SQL Editor öffnen',
        'Query ausführen: SELECT tablename FROM pg_tables WHERE schemaname = \'public\' AND tablename NOT IN (SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = \'public\')',
        'Liste der Tabellen ohne RLS notieren',
        'Für jede Tabelle: neue Migration anlegen (supabase/migrations/<timestamp>_rls_<tablename>.sql)',
        'Migration-Inhalt: ALTER TABLE <name> ENABLE ROW LEVEL SECURITY; CREATE POLICY rls_org ON <name> USING (organization_id = get_my_organization_id());',
        'supabase db push ausführen + manuell testen (anderer Org-User darf keine Daten sehen)',
      ],
      verification:
        'Alle User-Daten-Tabellen haben RLS aktiviert. ' +
        'SQL-Query gibt leere Liste zurück. ' +
        'Manueller Test mit zweitem Org-User bestätigt Isolation.',
    },
    {
      id: 'service-role-frontend',
      matchRuleIds: ['sec-db-02'],
      matchMessagePatterns: [/service.*role.*frontend|service.*key.*client|supabaseAdmin.*client/i],
      title: 'Service-Role-Key im Frontend — sofort entfernen',
      problem:
        'Der Supabase Service-Role-Key wird im Frontend-Bundle verwendet oder ist als ' +
        'NEXT_PUBLIC_-Variable gesetzt. Dieser Key bypassed RLS vollständig — ' +
        'mit ihm kann jeder User alle Daten lesen, schreiben und löschen.',
      impact:
        'Kritischste Sicherheitslücke überhaupt: Browser-DevTools → Network-Tab → Key sichtbar. ' +
        'Mit dem Service-Role-Key hat ein Angreifer vollständigen DB-Zugriff ohne jede Einschränkung.',
      strategy:
        'Service-Role-Key ausschließlich server-seitig in API-Routes und Edge Functions. ' +
        'Kein NEXT_PUBLIC_SUPABASE_SERVICE_KEY. Kein `supabaseAdmin` Import in Client-Komponenten.',
      firstStep:
        "Cursor-Prompt: 'Durchsuche das gesamte Projekt nach SUPABASE_SERVICE_ROLE_KEY oder supabaseAdmin. " +
        "Prüfe ob diese Importe in Dateien mit \"use client\" oder in NEXT_PUBLIC_-Variablen vorkommen. " +
        "Entferne alle Client-seitigen Vorkommen. supabaseAdmin darf nur in src/app/api/, " +
        "src/lib/ (server-only) und supabase/functions/ verwendet werden.'",
      fixApproach: 'per-file',
      verification:
        'Kein Import von supabaseAdmin in Dateien mit "use client". ' +
        'SUPABASE_SERVICE_ROLE_KEY ist keine NEXT_PUBLIC_-Variable. ' +
        '`grep -r "supabaseAdmin" src/components` gibt leere Ausgabe.',
    },
    {
      id: 'anon-key-wildcard-write',
      matchRuleIds: ['sec-db-03'],
      matchMessagePatterns: [/anon.*key.*write|anon.*insert.*all|public.*insert.*policy/i],
      title: 'Anon-Key mit Wildcard-Schreibzugriff — RLS-Policies einschränken',
      problem:
        'Tabellen haben INSERT/UPDATE-Policies die für alle anonymen User offen sind (`USING (true)`). ' +
        'Das bedeutet: jeder ohne Account kann Daten schreiben. ' +
        'Typischer Fehler beim schnellen Entwickeln — und ein kritisches Prod-Risiko.',
      impact:
        'Spam, Datenmüll, Ressourcen-Erschöpfung und potenziell privilege escalation ' +
        'wenn z.B. die users-Tabelle öffentlich beschreibbar ist.',
      strategy:
        'Alle INSERT/UPDATE/DELETE-Policies prüfen. ' +
        'Policy `USING (true)` oder `WITH CHECK (true)` auf Tabellen mit sensiblen Daten entfernen. ' +
        'Ersetzen durch `auth.uid() IS NOT NULL` (minimum) oder `organization_id = get_my_organization_id()`.',
      firstStep:
        'In Supabase SQL Editor ausführen: ' +
        '`SELECT tablename, policyname, cmd, qual FROM pg_policies ' +
        'WHERE schemaname = \'public\' AND (qual = \'true\' OR with_check = \'true\') ' +
        'AND cmd IN (\'INSERT\', \'UPDATE\', \'DELETE\');` ' +
        '— gibt alle Wildcard-Schreib-Policies zurück. Jede davon prüfen und einschränken.',
      fixApproach: 'config-change',
      manualSteps: [
        'Supabase Dashboard → SQL Editor öffnen',
        'Query ausführen: SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = \'public\' AND (qual = \'true\' OR with_check = \'true\') AND cmd IN (\'INSERT\', \'UPDATE\', \'DELETE\')',
        'Jede gefundene Policy prüfen: ist USING(true) bewusst (z.B. beta_waitlist public INSERT) oder ein Fehler?',
        'Fehlerhafte Policies: DROP POLICY + neue Policy mit auth.uid() IS NOT NULL oder Org-Check',
        'Bewusste Ausnahmen (wie public beta waitlist) in docs/security/rls-exceptions.md dokumentieren',
        'Migration anlegen und via supabase db push deployen',
      ],
      verification:
        'Kein USING(true) oder WITH CHECK(true) auf INSERT/UPDATE/DELETE-Policies für sensible Tabellen. ' +
        'Ausnahmen sind in rls-exceptions.md dokumentiert.',
    },
    {
      id: 'storage-buckets-no-policies',
      matchRuleIds: ['sec-db-07'],
      matchMessagePatterns: [/storage.*bucket.*polic|bucket.*no.*polic|storage.*polic.*missing/i],
      title: 'Storage-Buckets ohne Policies — Dateizugriff einschränken',
      problem:
        'Supabase Storage-Buckets haben keine oder zu offene Access-Policies. ' +
        'Ein public Bucket ohne Policy ist für jeden anonym lesbar. ' +
        'Ein private Bucket ohne Insert-Policy kann trotzdem von anderen Org-Usern beschrieben werden.',
      impact:
        'Uploads anderer User lesbar, sensible Dokumente öffentlich zugänglich, ' +
        'unbegrenzter Upload-Zugriff für alle authentifizierten User.',
      strategy:
        'Jeder Bucket braucht explizite Policies für SELECT, INSERT, UPDATE, DELETE. ' +
        'Schema: `(storage.foldername(name))[1] = auth.uid()::text` für User-eigene Files, ' +
        '`organization_id`-Check für Org-Dateien.',
      firstStep:
        'Supabase Dashboard → Storage → Policies öffnen. ' +
        'Für jeden Bucket prüfen: Welche Policies existieren? ' +
        'Dann: `SELECT * FROM storage.policies WHERE bucket_id IN (SELECT id FROM storage.buckets);` ' +
        'ausführen um fehlende Policies zu identifizieren.',
      fixApproach: 'config-change',
      manualSteps: [
        'Supabase Dashboard → Storage → Policies öffnen',
        'Jeden Bucket auf vorhandene SELECT/INSERT/UPDATE/DELETE-Policies prüfen',
        'Für Buckets ohne vollständige Policies: Policies über Dashboard oder Migration anlegen',
        'Empfehlung für User-Dokumente: INSERT für auth.uid() IS NOT NULL; SELECT/DELETE nur für eigene Files ((storage.foldername(name))[1] = auth.uid()::text)',
        'Öffentliche Buckets (avatars, logos): nur SELECT öffentlich; INSERT/UPDATE/DELETE nur mit Auth',
        'Migration mit CREATE POLICY-Statements in supabase/migrations/ ablegen',
      ],
      verification:
        'Alle Buckets haben explizite SELECT/INSERT/UPDATE/DELETE-Policies. ' +
        '`SELECT * FROM storage.policies` gibt für alle Buckets mindestens eine Policy zurück.',
    },
    {
      id: 'edge-functions-service-role',
      matchRuleIds: ['sec-db-08'],
      matchMessagePatterns: [/edge.*function.*service.*role|service.*role.*user.*context|edge.*service.*key/i],
      title: 'Edge Functions mit Service-Role im User-Context — Scope eingrenzen',
      problem:
        'Edge Functions nutzen den Service-Role-Key auch für User-Requests. ' +
        'Das bedeutet: alle DB-Queries in der Edge Function bypassen RLS und laufen als Admin. ' +
        'Jede Logik-Schwachstelle in der Function ist automatisch ein Full-DB-Compromise.',
      impact:
        'Ein Bug in einer Edge Function (z.B. fehlender Org-Filter) gibt den gesamten Datenbankinhalt preis — ' +
        'weil RLS nicht greift. Kein Defense-in-Depth.',
      strategy:
        'Edge Functions sollten für User-Requests den User-Context-Client nutzen ' +
        '(`createClient(url, anonKey, { global: { headers: { Authorization: "Bearer <user_jwt>" } } })`). ' +
        'Service-Role nur für echte Admin-Operationen die kein User-Kontext haben (z.B. Cron-Jobs).',
      firstStep:
        "Cursor-Prompt: 'Öffne supabase/functions/ai-chat/index.ts. " +
        "Prüfe ob DB-Queries für User-Daten über supabaseAdmin (Service Role) laufen. " +
        "Erstelle einen User-Context-Supabase-Client mit dem JWT aus dem Authorization-Header: " +
        "`const userClient = createClient(url, anonKey, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })`. " +
        "Nutze userClient für alle User-spezifischen Queries, behalte supabaseAdmin nur für " +
        "System-Operationen wie Budget-Check-RPC.'",
      fixApproach: 'per-file',
      verification:
        'User-spezifische DB-Queries in Edge Functions laufen über User-Context-Client. ' +
        'Service-Role-Client nur noch für System-RPCs und Admin-Operationen ohne User-Bezug.',
    },
    {
      id: 'backup-not-documented',
      matchRuleIds: ['sec-db-10'],
      matchMessagePatterns: [/backup.*strateg|backup.*not.*document|disaster.*recov/i],
      title: 'Backup-Strategie nicht dokumentiert — Runbook anlegen, Restore testen',
      problem:
        'Es gibt kein dokumentiertes Backup- und Recovery-Verfahren. ' +
        'Supabase Pro bietet PITR — aber "es gibt Backups" ist keine Strategie. ' +
        'Ohne Runbook weißt du im Ernstfall nicht: welche Daten, welcher Zeitpunkt, wie lange dauert Restore?',
      impact:
        'Im Ernstfall (Datenverlust, Ransomware, versehentliches Löschen) verlierst du wertvolle Zeit ' +
        'mit Improvisation statt mit Wiederherstellung. RTO/RPO-Versprechen an Kunden sind nicht einhaltbar.',
      strategy:
        'Einmalig ein Disaster-Recovery-Runbook anlegen: Backup-Typ (PITR/Daily), RTO-Ziel, RPO-Ziel, ' +
        'Restore-Prozess Schritt-für-Schritt. Dann: einen Restore-Test in ein Testprojekt durchführen und dokumentieren.',
      firstStep:
        'docs/runbooks/disaster-recovery.md anlegen. ' +
        'Mindestinhalt: (1) Backup-Provider + Typ, (2) RTO-Ziel, (3) RPO-Ziel, ' +
        '(4) Restore-Prozess Schritt-für-Schritt, (5) Letztes Test-Datum + Ergebnis (TODO: ausfüllen nach erstem Test).',
      fixApproach: 'documentation',
      manualSteps: [
        'Supabase Dashboard → Database → Backups öffnen und PITR-Status prüfen',
        'docs/runbooks/disaster-recovery.md anlegen (Template: Backup-Typ, RTO, RPO, Restore-Schritte)',
        'Restore-Test planen: separates Supabase-Testprojekt anlegen',
        'PITR-Restore durchführen: Zeitstempel ~1 Stunde in der Vergangenheit wählen → in Testprojekt restoren',
        'Im Testprojekt prüfen: SELECT COUNT(*) FROM users — Ergebnis mit Produktion vergleichen',
        'Datum, Ergebnis und Anzahl Rows im Runbook unter "Letzter Test" eintragen',
        'Jährlichen Kalender-Reminder für Folgetest setzen',
      ],
      verification:
        'docs/runbooks/disaster-recovery.md existiert mit RTO/RPO-Angaben, vollständigen Restore-Schritten ' +
        'und einem ausgefüllten "Letzter Test"-Eintrag mit Datum und Ergebnis.',
    },

  // ── Code-Qualität (added 2026-04-29) ─────────────────────────────────────────
  // ── cat-1-rule-1 ── Schichtenarchitektur ─────────────────────────────────
    {
      id: 'layered-architecture',
      matchRuleIds: ['cat-1-rule-1'],
      matchMessagePatterns: [/business.logic.*(route|page|component)|fetch.*in.*component|db.*access.*ui/i],
      title: 'Business-Logik in Routes und UI — Schichten fehlen',
      problem:
        'API-Routes und React-Komponenten enthalten Datenbankzugriffe, Berechnungen und ' +
        'Validierungslogik direkt — kein `src/lib/`-Layer trennt die Schichten. ' +
        'Was heute eine Route erledigt, kann morgen nicht wiederverwendet werden.',
      impact:
        'Ohne klare Schichten wächst jede neue Anforderung in die Breite statt in die Tiefe — ' +
        'Code-Dopplung, schwer testbare Logik und Regressions bei Refactorings sind die Folge.',
      strategy:
        'Business-Logik konsequent in `src/lib/<feature>/` auslagern. ' +
        'API-Routes rufen nur noch Lib-Funktionen auf und geben deren Ergebnis als Response zurück. ' +
        'Komponenten rufen nur noch Hooks oder Server Actions auf — nie direkt Supabase.',
      firstStep:
        'Cursor-Prompt: \'Identifiziere alle API-Route-Dateien in `src/app/api/`, die direkte ' +
        'Datenbankzugriffe (supabase.from) neben Business-Logik (Berechnungen, Validierungen) enthalten. ' +
        'Extrahiere die Business-Logik pro Route in eine neue Datei `src/lib/<feature>/<entity>.ts`. ' +
        'Die Route importiert die Funktion und gibt nur noch deren Ergebnis zurück.\'',
      fixApproach: 'per-file',
      verification:
        'Kein direkter `supabase.from()`-Aufruf in React-Komponenten. ' +
        'Alle API-Routes sind unter 60 Zeilen (nur Parsing + Lib-Call + Response).',
    },
  
    // ── cat-1-rule-2 + cat-1-rule-3 ── Business-Logik in UI + Zirkuläre Abhängigkeiten ────
    {
      id: 'business-logic-in-ui',
      matchRuleIds: ['cat-1-rule-2', 'cat-1-rule-3'],
      matchMessagePatterns: [/business.*logic.*ui|circular.*import|circular.*depend/i],
      title: 'Business-Logik in UI-Komponenten und zirkuläre Imports — zwei Symptome, eine Ursache',
      problem:
        'UI-Komponenten importieren direkt aus `src/lib/` und bauen eigene Berechnungen auf, ' +
        'statt diese Logik in Hooks oder Server Actions zu kapseln. ' +
        'Zirkuläre Imports entstehen, wenn Module sich gegenseitig importieren — ' +
        'ein sicheres Zeichen dass die Schichtengrenzen nicht eingehalten werden.',
      impact:
        'Zirkuläre Imports können zu Runtime-Fehlern führen (Modul ist beim Import noch `undefined`). ' +
        'Business-Logik in UI-Komponenten macht Logik nicht testbar und erzeugt Kopplung ' +
        'die jedes Refactoring zum Risiko macht.',
      strategy:
        'Schichtenhierarchie einhalten: `ui → hooks → lib → db`. ' +
        'Keine Importe in umgekehrter Richtung. Zirkuläre Imports durch Extraktion ' +
        'einer geteilten Typen- oder Util-Datei auflösen.',
      firstStep:
        'Cursor-Prompt: \'Führe `pnpm exec depcruise --include-only "^src" --output-type dot src/ | dot -T svg > dep-graph.svg` aus. ' +
        'Identifiziere alle zirkulären Import-Zyklen in der Ausgabe. ' +
        'Für jeden Zyklus: extrahiere die geteilten Typen in eine neue `*.types.ts`-Datei ' +
        'und ersetze die zirkulären Importe durch Importe aus dieser Typen-Datei.\'',
      fixApproach: 'per-file',
      verification:
        '`pnpm exec depcruise --include-only "^src" src/` meldet keine zirkulären Abhängigkeiten. ' +
        'Keine React-Komponenten mit direkten Datenbankzugriffen.',
    },
  
    // ── cat-1-rule-5 ── ADRs fehlen ─────────────────────────────────────────
    {
      id: 'missing-adrs',
      matchRuleIds: ['cat-1-rule-5'],
      matchMessagePatterns: [/ADR|architecture.*decision|decision.*record/i],
      title: 'Kerntechnologieentscheidungen nicht dokumentiert — warum wurde X gewählt?',
      problem:
        'Wichtige Architektur-Entscheidungen (Bibliothekswahl, API-Design, Datenbankstrategie) ' +
        'existieren nur in Köpfen oder Chat-Verläufen — kein `docs/adr/`-Verzeichnis hält sie fest. ' +
        'Neue Teammitglieder und zukünftige Selbst fragen sich dann: warum ist das so?',
      impact:
        'Ohne dokumentierte Entscheidungen werden gute Entscheidungen wiederentdeckt, ' +
        'schlechte Entscheidungen unbewusst kopiert und Architektur-Diskussionen jedes Mal neu geführt.',
      strategy:
        'Drei bis fünf ADRs für die wichtigsten Technologie-Entscheidungen anlegen. ' +
        'Format: Status / Kontext / Entscheidung / Konsequenzen. ' +
        'Kein Roman — eine halbe Seite pro ADR reicht.',
      firstStep:
        'Verzeichnis `docs/adr/` anlegen. ' +
        'Erste ADR für die wichtigste Entscheidung der letzten drei Monate schreiben: ' +
        '`ADR-001-<thema>.md` mit den vier Pflicht-Sektionen (Status / Kontext / Entscheidung / Konsequenzen). ' +
        'Danach: eine ADR pro Woche für die nächsten offenen Entscheidungen.',
      fixApproach: 'documentation',
      manualSteps: [
        'Verzeichnis `docs/adr/` anlegen falls noch nicht vorhanden',
        'Die drei wichtigsten technischen Entscheidungen der letzten 6 Monate identifizieren (z.B. Datenbank-Wahl, Auth-Strategie, State-Management)',
        'Pro Entscheidung eine Datei `ADR-00N-thema.md` anlegen mit: Status (Accepted/Deprecated), Kontext (warum musste eine Entscheidung getroffen werden?), Entscheidung (was wurde gewählt?), Konsequenzen (trade-offs)',
        'In CLAUDE.md oder README auf das ADR-Verzeichnis verweisen',
      ],
      verification:
        'Mindestens drei ADR-Dateien in `docs/adr/` — eine pro kritische Kerntechnologie.',
    },
  
    // ── cat-2-rule-1 ── TypeScript Strict Mode ──────────────────────────────
    {
      id: 'typescript-strict',
      matchRuleIds: ['cat-2-rule-1'],
      matchMessagePatterns: [/strict.*mode|tsconfig.*strict|noImplicitAny|strictNullChecks/i],
      title: 'TypeScript Strict Mode nicht aktiv — Laufzeitfehler bleiben unsichtbar',
      problem:
        '`tsconfig.json` hat `"strict": false` oder fehlt den strict-Flag. ' +
        'Ohne strict fängt TypeScript nur einen Bruchteil der möglichen Laufzeitfehler ab — ' +
        'null-Dereferenzierungen, implizite `any`-Typen und falsche Funktionssignaturen ' +
        'bleiben unsichtbar bis sie in Produktion knallen.',
      impact:
        'Null-Fehler, implizite `any`-Casts und falsche API-Verträge schleichen sich durch ' +
        'und fallen erst auf wenn ein Nutzer auf einen leeren State trifft oder die App wirft.',
      strategy:
        '`"strict": true` in `tsconfig.json` setzen, dann alle neuen Fehler systematisch beheben: ' +
        'zuerst `noImplicitAny` (häufigste), dann `strictNullChecks` (sicherheitskritisch), ' +
        'dann `strictFunctionTypes`.',
      firstStep:
        'Cursor-Prompt: \'Setze `"strict": true` in `tsconfig.json`. ' +
        'Führe `pnpm exec tsc --noEmit` aus und liste alle resultierenden Fehler auf. ' +
        'Behebe sie kategorienweise: zuerst alle `noImplicitAny`-Fehler durch explizite Typen, ' +
        'dann alle `strictNullChecks`-Fehler durch Null-Guards oder optionale Chaining.\'',
      fixApproach: 'config-change',
      verification:
        '`pnpm exec tsc --noEmit` läuft ohne Fehler mit `"strict": true` in `tsconfig.json`.',
    },
  
    // ── cat-2-rule-2 + cat-2-rule-9 ── ESLint nicht konfiguriert + Violations ─
    {
      id: 'eslint-config-violations',
      matchRuleIds: ['cat-2-rule-2', 'cat-2-rule-9'],
      matchMessagePatterns: [/eslint.*(not.*config|missing|violation|error)|no.*eslint/i],
      title: 'ESLint nicht konfiguriert oder mit Verletzungen — statische Analyse einrichten',
      problem:
        'Entweder fehlt eine ESLint-Konfiguration komplett oder bekannte Regeln werden verletzt ' +
        'ohne dass der Build daran scheitert. ' +
        'ESLint ist die erste Verteidigungslinie gegen häufige Fehler-Muster — ' +
        'ausgeschaltet oder ignoriert schützt er vor nichts.',
      impact:
        'Ohne aktives ESLint schleichen sich `any`-Casts, leere catch-Blöcke, ' +
        'fehlende Dependencies in `useEffect` und andere häufige Fehler durch ' +
        'Code-Reviews und in die Produktion.',
      strategy:
        'ESLint mit `next` + `typescript-eslint` Konfiguration einrichten. ' +
        'Dann einen ersten Autofix-Durchlauf fahren und die verbleibenden Fehler ' +
        'kategorienweise beheben.',
      firstStep:
        'Cursor-Prompt: \'Prüfe ob `.eslintrc.json` oder `eslint.config.js` existiert. ' +
        'Falls nicht: `pnpm add -D eslint eslint-config-next @typescript-eslint/eslint-plugin` ' +
        'und eine `.eslintrc.json` mit `{ "extends": ["next/core-web-vitals", "next/typescript"] }` anlegen. ' +
        'Dann `pnpm exec eslint --fix src/` ausführen und den Diff reviewen.\'',
      fixApproach: 'config-change',
      verification:
        '`pnpm exec eslint src/` läuft ohne Errors (Warnings erlaubt). ' +
        'CI-Pipeline schlägt bei ESLint-Fehlern fehl.',
    },
  
    // ── cat-2-rule-8 ── Auskommentierter Code ────────────────────────────────
    {
      id: 'commented-out-code',
      matchRuleIds: ['cat-2-rule-8'],
      matchMessagePatterns: [/comment.*block|auskommentiert|commented.out.code/i],
      title: 'Auskommentierter Code — Git ersetzt Kommentar-Archive',
      problem:
        'Mehrere Dateien enthalten Kommentar-Blöcke mit auskommentiertem Code — ' +
        'meistens alte Implementierungen, Versuche oder "vielleicht später"-Snippets. ' +
        'Das ist technischer Ballast: er erschwert das Lesen, ohne einen Mehrwert zu liefern.',
      impact:
        'Kommentierter Code erzeugt kognitive Last bei jedem Lesenden: ' +
        '"Ist das wichtig? Kommt das wieder? Warum liegt das noch da?" — ' +
        'und er veraltet schnell, weil er nicht mehr vom Compiler geprüft wird.',
      strategy:
        'Alle Kommentar-Blöcke über zwei Zeilen Code-Inhalt löschen. ' +
        'Git-History ist das Archiv — wer alten Code braucht, findet ihn per `git log -p`. ' +
        'Ausnahme: intentionale Erklärungskommentare mit "warum", kein "was".',
      firstStep:
        'Cursor-Prompt: \'Suche in `src/` nach Kommentar-Blöcken die mehr als zwei Zeilen ' +
        'auskommentierten Code enthalten (Muster: aufeinanderfolgende `//`-Zeilen oder `/* */`-Blöcke ' +
        'mit Code-Syntax). Lösche diese Blöcke. ' +
        'Behalte Kommentare die erklären warum etwas so implementiert ist (TODO, HACK, NOTE mit Begründung).\'',
      fixApproach: 'per-file',
      verification:
        'Keine Datei in `src/` enthält mehr als zwei aufeinanderfolgende auskommentierte Code-Zeilen.',
    },
  
    // ── cat-2-rule-12 ── Cognitive Complexity ───────────────────────────────
    {
      id: 'cognitive-complexity',
      matchRuleIds: ['cat-2-rule-12'],
      matchMessagePatterns: [/cognitive.*complex|CC.*(hoch|high|wert|score)|complexity.*too.*high/i],
      title: 'Cognitive Complexity zu hoch — verschachtelte Logik aufbrechen',
      problem:
        'Mehrere Funktionen haben einen hohen CC-Wert (Cognitive Complexity) — ' +
        'zu viele verschachtelte if/else, Schleifen und frühe Returns die gleichzeitig ' +
        'im Kopf gehalten werden müssen. ' +
        'Wer die Funktion liest, muss alle Pfade gleichzeitig verstehen.',
      impact:
        'Hohe Cognitive Complexity korreliert direkt mit Bug-Dichte. ' +
        'Jeder neue Pfad erhöht die Wahrscheinlichkeit dass ein Edge Case übersehen wird — ' +
        'und macht Tests exponentiell aufwändiger.',
      strategy:
        'Early Returns einführen um Happy Path flach zu halten. ' +
        'Komplexe Bedingungs-Ketten in benannte Hilfsfunktionen auslagern. ' +
        'Ziel: CC < 15 pro Funktion, bevorzugt < 10.',
      firstStep:
        'Cursor-Prompt: \'Öffne die Funktion mit dem höchsten CC-Wert aus den gefundenen Findings. ' +
        'Identifiziere alle verschachtelten if/else-Blöcke. ' +
        'Konvertiere Guards zu Early Returns: `if (!condition) return` statt `if (condition) { ... }`. ' +
        'Extrahiere komplexe Bedingungs-Ausdrücke in benannte Hilfsfunktionen mit aussagekräftigen Namen. ' +
        'Ziel: CC-Wert der Funktion auf unter 15 senken.\'',
      fixApproach: 'per-file',
      verification:
        '`pnpm exec eslint --rule "complexity: [error, 15]" src/` meldet keine Fehler.',
    },
  
    // ── cat-25-rule-1 + cat-25 ── Naming-Konventionen ────────────────────────
    {
      id: 'naming-conventions',
      matchRuleIds: ['cat-25-rule-1', 'cat-25'],
      matchMessagePatterns: [/naming.*convention|camelcase|pascalcase|snake_case.*component|kebab.*(component|hook)/i],
      title: 'Naming-Konventionen verletzt — Konsistenz durch einen einzigen Durchlauf',
      problem:
        'Dateien und Symbole folgen keiner einheitlichen Konvention: ' +
        'React-Komponenten in `camelCase`, Hooks ohne `use`-Prefix, ' +
        'Utility-Dateien in `PascalCase` oder Konstanten in `camelCase`. ' +
        'Das macht Suche, Navigation und Code-Reviews unnötig aufwändig.',
      impact:
        'Inkonsistente Namen erzeugen mentale Reibung bei jedem Lesenden — ' +
        'besonders bei Onboarding neuer Mitarbeiter oder bei der Rückkehr nach längerer Pause.',
      strategy:
        'Konventionen einmalig festlegen und in einem Durchlauf durchsetzen. ' +
        'Next.js-Standard: Komponenten PascalCase, Hooks `use*`, Utils camelCase, ' +
        'Ordner kebab-case, Konstanten UPPER_SNAKE_CASE.',
      firstStep:
        'Cursor-Prompt: \'Prüfe alle Dateien in `src/components/` auf PascalCase-Dateinamen, ' +
        'alle Dateien in `src/hooks/` auf `use`-Prefix, alle Dateien in `src/lib/` auf camelCase. ' +
        'Liste alle Abweichungen auf und benenne die Dateien korrekt um. ' +
        'Aktualisiere alle Import-Statements die die umbenannten Dateien referenzieren.\'',
      fixApproach: 'per-file',
      verification:
        'Alle Dateien in `src/components/` sind PascalCase. ' +
        'Alle Custom Hooks starten mit `use`. ' +
        'Alle Utility-Dateien in `src/lib/` sind camelCase.',
    },
  
    // ── cat-26-rule-1 + cat-26 ── SLOP-Detection ────────────────────────────
    {
      id: 'slop-detection',
      matchRuleIds: ['cat-26-rule-1', 'cat-26'],
      matchMessagePatterns: [
        /placeholder.*comment|TODO.*implement|FIXME.*later|KI.*(fingerprint|generated)|mixed.*language|sprach.*mix/i,
        /slop.*detect|slop-detect/i,
      ],
      title: 'SLOP-Signale im Code — KI-Fingerprints, Placeholder und Sprachwechsel bereinigen',
      problem:
        'Der Code zeigt typische KI-Generierungs-Spuren: Placeholder-Kommentare wie ' +
        '`// TODO: implement this`, übermäßige Erklärungskommentare die offensichtliche Dinge beschreiben, ' +
        'Placeholder-Credentials wie `"password123"` oder `"YOUR_API_KEY_HERE"`, ' +
        'und gemischte Sprachen innerhalb derselben Datei (Deutsch + Englisch ohne Systematik). ' +
        'Das zeigt an, dass KI-Output nicht ausreichend nachbearbeitet wurde.',
      impact:
        'Placeholder-Kommentare bleiben oft unbegrenzt stehen und verfehlen ihren Zweck. ' +
        'Placeholder-Credentials sind Sicherheitsrisiken sobald sie in Test-Umgebungen landen. ' +
        'Gemischte Sprachen erschweren Code-Reviews und Onboarding.',
      strategy:
        'Einen Bereinigungsdurchlauf machen: alle `TODO: implement`-Kommentare entweder ' +
        'sofort implementieren oder als GitHub Issue erfassen und den Kommentar löschen. ' +
        'Alle Placeholder-Credentials durch `process.env.VARIABLE_NAME` ersetzen. ' +
        'Eine Sprache pro Codebase wählen (empfohlen: Englisch für Code, ' +
        'Deutsch für UI-Strings in i18n-Dateien) und konsequent durchhalten.',
      firstStep:
        'Cursor-Prompt: \'Suche in `src/` nach den Mustern: ' +
        '`// TODO: implement`, `// TODO: add`, `// FIXME: later`, ' +
        '`"YOUR_API_KEY"`, `"password123"`, `"placeholder"`. ' +
        'Für jeden Fund entscheiden: (a) sofort implementieren, ' +
        '(b) GitHub Issue erstellen und Kommentar löschen, ' +
        'oder (c) durch echten Env-Var-Zugriff ersetzen. ' +
        'Danach alle Kommentare die offensichtliche Dinge beschreiben ' +
        '(`// increment counter`, `// return result`) löschen.\'',
      fixApproach: 'per-file',
      verification:
        'Kein `TODO: implement` oder `FIXME: later` in `src/`. ' +
        'Keine Placeholder-Strings wie `"YOUR_API_KEY_HERE"` im Code. ' +
        'Alle Kommentare erklären das "warum", nicht das "was".',
    },

  // ── DSGVO + KI-Act + Accessibility (added 2026-04-29) ─────────────────────────────────────────
  // ─── DSGVO: Consent-System ────────────────────────────────────────────────
    {
      id: 'consent-system-dsgvo',
      matchRuleIds: ['cat-4-rule-2'],
      title: '[DSGVO] Consent-System: technisch korrekt, aber DSGVO-konform?',
      problem:
        'Ein Consent-Banner ist vorhanden — aber ob er DSGVO-konform ist, lässt sich nur durch ' +
        'manuelle Prüfung feststellen. Die häufigsten Lücken: Pre-Checked-Boxen, kein echtes Opt-in, ' +
        'oder Tracking startet vor der Einwilligung.',
      impact:
        'Bußgeld bis 20 Mio. EUR oder 4 % des Jahresumsatzes (Art. 83 Abs. 5 DSGVO). ' +
        'Datenschutzbehörden prüfen Consent-Systeme aktiv — ein fehlerhafter Banner ist ein leicht ' +
        'messbarer Verstoß.',
      strategy:
        'Den Consent-Flow manuell durchspielen: Startet kein Tracking vor Klick auf "Akzeptieren"? ' +
        'Sind alle Kategorien standardmäßig deaktiviert? Ist "Ablehnen" genauso leicht wie "Akzeptieren"? ' +
        'DSGVO-Konformität ist kein einmaliger Fix, sondern ein regelmäßiger Check.',
      firstStep: '',
      fixApproach: 'documentation',
      manualSteps: [
        'Browser-DevTools öffnen → Network-Tab → Seite neu laden ohne zu klicken',
        'Prüfen: Werden vor Consent-Klick Drittanbieter-Requests gemacht (Google, Meta, Hotjar etc.)?',
        'Consent-Banner öffnen: Sind alle Toggles standardmäßig AUS? Ist "Alles ablehnen" sichtbar?',
        'Datenschutzerklärung prüfen: Sind alle Drittanbieter und Zwecke (Art. 13) aufgelistet?',
        'Ergebnis + Datum in docs/legal/consent-audit.md dokumentieren',
      ],
      verification: 'Kein Drittanbieter-Request vor explizitem Consent. Alle Toggles standardmäßig deaktiviert. Ergebnis in docs/legal/consent-audit.md mit Datum.',
    },
  
    // ─── DSGVO: Rechtsgrundlagen Art. 6 ──────────────────────────────────────
    {
      id: 'rechtsgrundlagen-art6',
      matchRuleIds: ['cat-4-rule-4'],
      title: '[DSGVO] Rechtsgrundlagen nicht dokumentiert — Art. 6 DSGVO ist nicht optional',
      problem:
        'Jede Verarbeitung personenbezogener Daten braucht eine Rechtsgrundlage nach Art. 6 DSGVO. ' +
        'Ohne Dokumentation kann weder das Team noch ein Anwalt schnell prüfen, ob die Verarbeitung ' +
        'rechtmäßig ist — und im Ernstfall ist das der erste Punkt den eine Behörde prüft.',
      impact:
        'Bußgeld bis 20 Mio. EUR oder 4 % des Jahresumsatzes (Art. 83 Abs. 5 lit. a DSGVO). ' +
        'Ohne dokumentierte Rechtsgrundlagen fehlt die Basis für jede Verarbeitungsaktivität — ' +
        'das VVT (Art. 30) ist ohne sie sinnlos.',
      strategy:
        'Für jede Datenverarbeitungsaktivität (Login, Chat, Billing, Analytics) die zutreffende ' +
        'Rechtsgrundlage festhalten: Vertrag (Art. 6 Abs. 1 lit. b), Einwilligung (lit. a), ' +
        'berechtigtes Interesse (lit. f) oder gesetzliche Pflicht (lit. c). ' +
        'Einmal erstellen — dann regelmäßig bei neuen Features aktualisieren.',
      firstStep: '',
      fixApproach: 'documentation',
      manualSteps: [
        'docs/legal/rechtsgrundlagen.md erstellen (oder bestehende Datenschutz-Doku öffnen)',
        'Alle Verarbeitungstätigkeiten auflisten: Login/Auth, Chat-Verläufe, Billing, Analytics, E-Mail',
        'Für jede Tätigkeit Rechtsgrundlage nach Art. 6 Abs. 1 DSGVO festlegen (a/b/c/e/f)',
        'Begründung für "berechtigtes Interesse" (lit. f) besonders sorgfältig dokumentieren',
        'Datenschutzanwalt zur finalen Prüfung hinzuziehen — das ist kein DIY-Dokument',
      ],
      verification: 'docs/legal/rechtsgrundlagen.md listet alle Verarbeitungstätigkeiten mit Rechtsgrundlage und Datum der letzten Prüfung.',
    },
  
    // ─── DSGVO: AVV Art. 28 ───────────────────────────────────────────────────
    {
      id: 'avv-missing',
      matchRuleIds: ['cat-4-rule-5'],
      title: '[DSGVO] AVV mit Drittanbietern fehlt — Art. 28 DSGVO ist nicht optional',
      problem:
        'Supabase, Vercel und andere Drittanbieter verarbeiten personenbezogene Daten im Auftrag. ' +
        'Ohne Auftragsverarbeitungsvertrag (AVV) ist jede Datenübertragung rechtswidrig — ' +
        'DSGVO Art. 28 ist nicht optional.',
      impact:
        'Bußgeld bis 10 Mio. EUR oder 2 % des Jahresumsatzes (Art. 83 Abs. 4 DSGVO). ' +
        'Bei einer Datenpanne ohne AVV haftet der Verantwortliche vollständig — ' +
        'ohne Rückgriff auf den Dienstleister.',
      strategy:
        'AVV mit jedem Auftragsverarbeiter abschließen, der Zugriff auf personenbezogene Daten hat. ' +
        'Supabase und Vercel bieten Standard-DPAs in den Account-Einstellungen an — das dauert ' +
        'meist unter 10 Minuten pro Anbieter.',
      firstStep: '',
      fixApproach: 'documentation',
      manualSteps: [
        'Supabase: app.supabase.com → Organisation → Settings → Legal → DPA akzeptieren',
        'Vercel: vercel.com → Settings → Legal → Data Processing Agreement akzeptieren',
        'Anthropic: console.anthropic.com → Settings → Privacy → DPA prüfen/anfordern',
        'Sentry: sentry.io → Settings → Legal → Data Processing Agreement',
        'Resend/E-Mail-Provider: analog in Account-Einstellungen DPA prüfen',
        'Status in docs/legal/avv-status.md dokumentieren (Anbieter, Datum, Link)',
      ],
      verification: 'docs/legal/avv-status.md listet alle Drittanbieter mit Datum des abgeschlossenen AVV. Kein Anbieter ohne AVV der personenbezogene Daten verarbeitet.',
    },
  
    // ─── DSGVO: VVT Art. 30 ──────────────────────────────────────────────────
    {
      id: 'vvt-missing',
      matchRuleIds: ['cat-4-rule-8'],
      title: '[DSGVO] VVT (Verarbeitungsverzeichnis) fehlt — Art. 30 DSGVO',
      problem:
        'Das Verarbeitungsverzeichnis (VVT) nach Art. 30 DSGVO ist für jede Organisation ' +
        'mit regelmäßiger Datenverarbeitung Pflicht. Es fehlt im docs/-Verzeichnis. ' +
        'Ohne VVT hat weder das Team noch ein Datenschutzbeauftragter einen Überblick über ' +
        'alle Verarbeitungsaktivitäten.',
      impact:
        'Bußgeld bis 10 Mio. EUR oder 2 % des Jahresumsatzes. Ohne VVT kann keine Datenschutz-Folgenabschätzung ' +
        'durchgeführt werden, und bei Behördenprüfungen fehlt die Grundlage für jeden weiteren Nachweis ' +
        'der DSGVO-Konformität.',
      strategy:
        'Ein VVT ist kein monatelanger Prozess. Für eine Early-Stage-App mit wenigen Verarbeitungstätigkeiten ' +
        'reicht ein strukturiertes Markdown-Dokument. Wichtig: VVT muss aktuell gehalten werden — ' +
        'bei jedem neuen Feature oder Drittanbieter aktualisieren.',
      firstStep: '',
      fixApproach: 'documentation',
      manualSteps: [
        'docs/legal/vvt.md anlegen (Vorlage: art30-vvt-vorlage.md auf datenschutz.org)',
        'Für jede Verarbeitungstätigkeit erfassen: Name, Zweck, Rechtsgrundlage, Datenkategorien, Empfänger, Löschfristen',
        'Typische Tätigkeiten bei SaaS: Nutzer-Registrierung, Chat-Verläufe, Billing/Zahlungen, Support, Analytics',
        'Auftragsverarbeiter (AVV-Liste) im VVT als Empfänger eintragen',
        'Verantwortlichen und ggf. Datenschutzbeauftragten im VVT angeben',
        'Datum der Erstellung + letzten Aktualisierung im Kopf des Dokuments notieren',
      ],
      verification: 'docs/legal/vvt.md enthält alle Verarbeitungstätigkeiten mit Zweck, Rechtsgrundlage und Löschfristen. Datum der letzten Aktualisierung ist weniger als 6 Monate alt.',
    },
  
    // ─── DSGVO: Technische Maßnahmen (Hashing + HSTS + CSP) ──────────────────
    {
      id: 'technische-massnahmen',
      matchRuleIds: ['cat-4-rule-14', 'cat-4-rule-15', 'cat-4-rule-16'],
      title: '[DSGVO] Technische Schutzmaßnahmen — Art. 32 fordert Stand der Technik',
      problem:
        'DSGVO Art. 32 schreibt technische Maßnahmen zum Schutz personenbezogener Daten vor, ' +
        'die dem Stand der Technik entsprechen. Fehlende Maßnahmen (Passwort-Hashing, HSTS, CSP) ' +
        'sind nicht nur ein Sicherheitsproblem, sondern auch ein dokumentierter Compliance-Verstoß.',
      impact:
        'Bußgeld bis 10 Mio. EUR oder 2 % des Jahresumsatzes (Art. 83 Abs. 4 DSGVO). ' +
        'Bei einer Datenpanne ohne nachgewiesene Schutzmaßnahmen entfallen alle Haftungsmilderungen — ' +
        'die Behörde kann den Maximalrahmen ausschöpfen.',
      strategy:
        'Jede der drei Maßnahmen ist ein eigenständiger Config-Fix. Hashing ist bei Supabase-Auth ' +
        'automatisch erledigt. HSTS und CSP sind Header-Konfigurationen in next.config.ts — ' +
        'einmal richtig gesetzt, dauerhaft wirksam.',
      firstStep:
        'In `next.config.ts` die `headers()`-Funktion ergänzen:\n' +
        '`{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }`\n' +
        '`{ key: "Content-Security-Policy", value: "default-src \'self\'; ..." }`',
      fixApproach: 'config-change',
      verification: 'curl -I https://deine-domain.com zeigt Strict-Transport-Security und Content-Security-Policy Header. Supabase-Auth ist aktiv (kein eigenes Passwort-Hashing nötig).',
    },
  
    // ─── DSGVO: Datenexport + Account-Löschung (Art. 17/20) ──────────────────
    {
      id: 'betroffenenrechte-export-loeschung',
      matchRuleIds: ['cat-4-rule-17', 'cat-4-rule-18'],
      title: '[DSGVO] Betroffenenrechte: Datenexport + Account-Löschung fehlen — Art. 17 & 20',
      problem:
        'Nutzer haben ein Recht auf Datenübertragbarkeit (Art. 20) und auf Löschung (Art. 17). ' +
        'Beide Funktionen fehlen im System. Das ist kein "Nice to have" — ' +
        'Nutzer können diese Rechte jederzeit einfordern, und die Antwortfrist beträgt einen Monat.',
      impact:
        'Bußgeld bis 20 Mio. EUR oder 4 % des Jahresumsatzes bei Verstoß gegen Betroffenenrechte (Art. 83 Abs. 5 DSGVO). ' +
        'Jeder ignorierte Löschantrag oder fehlende Export ist eine eigenständige Pflichtverletzung.',
      strategy:
        'Beide Funktionen sind API-Endpoints mit Settings-UI. Datenexport: alle Nutzer-Daten als JSON-Download. ' +
        'Account-Löschung: mit Bestätigungs-Dialog und kaskadierendem Delete. ' +
        'Beide gehören in die Settings-Seite, nicht hinter Admin-Zugänge.',
      firstStep:
        '`GET /api/user/export` anlegen: Supabase-Query aller nutzerspezifischen Daten ' +
        '(conversations, messages, artifacts, preferences) → JSON-Response mit Content-Disposition: attachment.',
      fixApproach: 'central-fix',
      verification: 'GET /api/user/export liefert JSON-Download. DELETE /api/user/account löscht Nutzer-Daten mit Bestätigung. Beide Buttons sind in den User-Settings sichtbar.',
    },
  
    // ─── Fernabsatzrecht: AGB + Widerrufsbelehrung ───────────────────────────
    {
      id: 'agb-widerruf-fernabsatz',
      matchRuleIds: ['cat-4-rule-20', 'cat-4-rule-21'],
      title: '[Fernabsatzrecht] AGB + Widerrufsbelehrung fehlen — §§ 312d, 312g BGB',
      problem:
        'Für Online-Verkäufe (auch SaaS-Abos) schreibt das Fernabsatzrecht (§§ 312d ff. BGB) ' +
        'Allgemeine Geschäftsbedingungen und eine Widerrufsbelehrung vor. ' +
        'Ohne diese Seiten ist jeder Vertragsschluss rechtlich angreifbar.',
      impact:
        'Abmahnrisiko durch Wettbewerber oder Verbraucherschutzverbände (bis 250.000 EUR). ' +
        'Ohne Widerrufsbelehrung beginnt die 14-tägige Widerrufsfrist nie zu laufen — ' +
        'Kunden können theoretisch bis zu 12 Monate + 14 Tage widerrufen.',
      strategy:
        'Beide Seiten sind statische Inhalte — einmal anlegen, von einem Anwalt prüfen lassen. ' +
        'AGB: Vertragsschluss, Laufzeit, Kündigung, Haftung. ' +
        'Widerruf: Muster-Widerrufsformular nach Anlage 2 EGBGB verwenden.',
      firstStep: '',
      fixApproach: 'documentation',
      manualSteps: [
        'src/app/agb/page.tsx anlegen mit vollständigen AGB (Anwalt beauftragen oder Generator nutzen)',
        'src/app/widerruf/page.tsx anlegen mit Widerrufsbelehrung nach Muster EGBGB Anlage 2',
        'Footer-Links auf /agb und /widerruf ergänzen (Pflichtlinks neben Impressum)',
        'Im Checkout/Onboarding-Flow: Checkbox "Ich akzeptiere die AGB" vor Abschluss',
        'Anwalt zur rechtlichen Prüfung der AGB beauftragen (kein DIY bei Haftungsklauseln)',
      ],
      verification: 'Routen /agb und /widerruf existieren und sind öffentlich erreichbar. Footer enthält Links auf beide Seiten. Checkout-Flow hat AGB-Akzeptanz-Checkbox.',
    },
  
    // ─── AI Act: Klassifizierung + Risikoeinstufung ───────────────────────────
    {
      id: 'ai-act-klassifizierung',
      matchRuleIds: ['cat-4-rule-6', 'cat-22-rule-9'],
      title: '[KI-Act] AI Act Klassifizierung fehlt — Art. 6 EU AI Act',
      problem:
        'Der EU AI Act (gültig ab August 2026) verpflichtet Anbieter von KI-Systemen zu einer ' +
        'Risikoeinstufung. Ohne Dokumentation der Klassifizierung fehlt die Grundlage für alle ' +
        'weiteren Compliance-Anforderungen des AI Acts.',
      impact:
        'Bußgeld bis 35 Mio. EUR oder 7 % des Jahresumsatzes bei Hochrisiko-Verstößen (Art. 99 EU AI Act). ' +
        'Auch für Minimal-Risk-Systeme gilt Transparenzpflicht (Art. 50) — ohne Klassifizierung ' +
        'ist unklar, welche Pflichten gelten.',
      strategy:
        'Die meisten SaaS-KI-Anwendungen fallen in "Minimal Risk" oder "Limited Risk" — ' +
        'das ist ein klarer Vorteil. Die Klassifizierung selbst dauert wenige Stunden: ' +
        'Use Case prüfen gegen Anhang III (Hochrisiko-Liste) + Art. 50 Transparenzpflichten dokumentieren.',
      firstStep: '',
      fixApproach: 'documentation',
      manualSteps: [
        'docs/ai-act-risk-classification.md anlegen',
        'Use Case beschreiben: Wer nutzt das System? Für welche Entscheidungen?',
        'Anhang III EU AI Act prüfen: Fällt der Use Case unter Hochrisiko? (Biometrie, kritische Infra, Beschäftigung, Bildung etc.)',
        'Risikostufe festlegen: Minimal Risk / Limited Risk / High Risk',
        'Begründung dokumentieren warum kein Hochrisiko-System vorliegt',
        'Datenschutzanwalt oder KI-Compliance-Experten zur Prüfung hinzuziehen',
      ],
      verification: 'docs/ai-act-risk-classification.md enthält Risikostufe, Use-Case-Beschreibung, Begründung und Datum der letzten Prüfung.',
    },
  
    // ─── AI Act: KI-Interaktionen kennzeichnen + KI-Logging ──────────────────
    {
      id: 'ai-act-transparenz-logging',
      matchRuleIds: ['cat-22-rule-10', 'cat-22-rule-11'],
      title: '[KI-Act] KI-Kennzeichnung + Logging — Art. 50 & Art. 12 EU AI Act',
      problem:
        'Der EU AI Act Art. 50 verpflichtet dazu, Nutzer zu informieren wenn sie mit einem KI-System ' +
        'interagieren. Art. 12 fordert Logging von KI-Entscheidungen. Beide Anforderungen sind ' +
        'im UI und in der Datenbank noch nicht vollständig umgesetzt.',
      impact:
        'Bußgeld bis 15 Mio. EUR oder 3 % des Jahresumsatzes (Art. 99 Abs. 3 EU AI Act) ' +
        'bei Verletzung von Transparenzpflichten. Ohne Logging fehlt die Nachweisbarkeit ' +
        'bei Beschwerden oder Behördenanfragen.',
      strategy:
        'KI-Kennzeichnung ist meist ein UI-Element (Label, Avatar, Hinweistext). ' +
        'KI-Logging bedeutet: Modell-ID, Zeitstempel und User-ID bei jedem KI-Aufruf speichern — ' +
        'die `conversations`-Tabelle enthält bereits die nötige Struktur.',
      firstStep:
        'In der Chat-UI ein sichtbares KI-Label ergänzen: "KI-generierte Antwort" oder ' +
        '"Powered by KI" neben dem Assistenten-Avatar. Für Logging: `model` + `created_at` ' +
        'in der `conversations`-Tabelle sind bereits vorhanden — prüfen ob alle API-Calls sie befüllen.',
      fixApproach: 'central-fix',
      verification: 'Chat-UI zeigt sichtbares KI-Label bei jeder Assistenten-Antwort. Alle KI-Aufrufe schreiben model + timestamp in die DB. Datenschutz-Hinweis erwähnt KI-Einsatz.',
    },
  
    // ─── WCAG 2.1 AA: Lighthouse Accessibility ───────────────────────────────
    {
      id: 'wcag-lighthouse-a11y',
      matchRuleIds: ['cat-16-rule-1'],
      matchMessagePatterns: [/lighthouse.*accessibility|accessibility.*lighthouse/i],
      title: 'WCAG 2.1 AA — Lighthouse zeigt Barrierefreiheitsprobleme',
      problem:
        'Der Lighthouse-Accessibility-Score ist unter 90/100. Das bedeutet: ' +
        'Screenreader-Nutzer stoßen auf Barrieren, Tastaturnavigation ist lückenhaft, ' +
        'oder Kontrastverhältnisse erfüllen nicht den WCAG 2.1 AA-Standard.',
      impact:
        'BFSG (in DE seit 28.06.2025 für B2C SaaS): bis 100.000 EUR Bußgeld bei Verstoß. ' +
        'Darüber hinaus: ~20% der Bevölkerung haben eine Einschränkung — ' +
        'schlechte Barrierefreiheit bedeutet struktureller Ausschluss einer Nutzergruppe.',
      strategy:
        'Lighthouse-Findings nicht als Liste abarbeiten, sondern als Kategorien: ' +
        'Alt-Texte, ARIA-Labels, Farbkontrast, Tastatur-Navigation. ' +
        'Die meisten Findings lassen sich in einem einzigen Durchlauf fixen.',
      firstStep:
        '`pnpm add -D @axe-core/react` und in der Dev-Umgebung aktivieren. ' +
        'Dann die Lighthouse-Findings nach Kategorie gruppieren und je einen Durchlauf ' +
        'pro Kategorie einplanen. Alt-Texte und ARIA-Labels zuerst — ' +
        'die haben den größten Impact.',
      fixApproach: 'per-file',
      verification: 'Lighthouse Accessibility Score >= 90/100. pnpm exec lighthouse --only-categories=accessibility zeigt keine Critical-Findings.',
    },
  
    // ─── WCAG 2.1: ARIA-Nutzung fehlerhaft ───────────────────────────────────
    {
      id: 'aria-usage-incorrect',
      matchRuleIds: ['cat-16-rule-3'],
      matchMessagePatterns: [/aria.*fehler|aria.*incorrect|aria.*missing|fehlende.*aria/i],
      title: 'ARIA-Attribute fehlen oder sind fehlerhaft — Screenreader haben keine Orientierung',
      problem:
        'ARIA-Attribute sind entweder nicht vorhanden oder falsch eingesetzt. ' +
        'Falsches ARIA ist schlimmer als kein ARIA — es erzeugt irreführende Ansagen ' +
        'für Screenreader-Nutzer und kann Seiten unnutzbar machen.',
      impact:
        'Tastaturnutzer und Screenreader-Nutzer (ca. 2-3% der Bevölkerung) können die App ' +
        'nicht oder nur eingeschränkt nutzen. WCAG 2.1 AA-Verstoß — relevant für BFSG-Konformität.',
      strategy:
        'Statt ARIA überall hinzuzufügen: zuerst semantisches HTML prüfen. ' +
        'Viele ARIA-Probleme lösen sich durch korrekte HTML-Elemente (`<button>` statt `<div onClick>`, ' +
        '`<nav>` für Navigation, `<main>` für Hauptinhalt). ARIA nur dort wo HTML-Semantik nicht ausreicht.',
      firstStep:
        'Die Komponenten mit interaktiven Elementen identifizieren. ' +
        'Erstens: alle `<div onClick>` durch `<button>` ersetzen. ' +
        'Zweitens: Icons ohne sichtbaren Text bekommen `aria-label`. ' +
        'Drittens: modale Dialoge bekommen `role="dialog"` + `aria-labelledby`.',
      fixApproach: 'per-file',
      verification: 'pnpm exec axe --rules=aria-* zeigt keine Critical-Findings. Alle interaktiven Elemente sind per Tab-Taste erreichbar und haben aussagekräftige Labels.',
    },
  
    // ─── BFSG: Barrierefreiheitserklärung + Feedback-Mechanismus ──────────────
    {
      id: 'bfsg-erklaerung-feedback',
      matchRuleIds: ['cat-16-rule-5', 'cat-16-rule-6'],
      title: '[BFSG] Barrierefreiheitserklärung + Feedback-Mechanismus fehlen — BFSG §12',
      problem:
        'Das Barrierefreiheitsstärkungsgesetz (BFSG) gilt seit 28.06.2025 für B2C-SaaS in Deutschland. ' +
        '§12 BFSG verpflichtet zu einer Barrierefreiheitserklärung mit Feedback-Mechanismus. ' +
        'Beides fehlt.',
      impact:
        'Bußgeld bis 100.000 EUR (BFSG §31). Der Feedback-Mechanismus ist besonders wichtig: ' +
        'Nutzer mit Einschränkungen müssen eine Möglichkeit haben, Barrieren zu melden — ' +
        'und das Unternehmen hat 4 Wochen Zeit zu antworten.',
      strategy:
        'Die Barrierefreiheitserklärung ist eine statische Seite mit Pflichtangaben: ' +
        'aktueller Konformitätsstatus (teilweise konform / nicht konform), ' +
        'bekannte Einschränkungen, Feedback-Kontakt und Datum. ' +
        'Der einfachste Einstieg: EU-Vorlage verwenden und ehrlich ausfüllen.',
      firstStep: '',
      fixApproach: 'documentation',
      manualSteps: [
        'src/app/barrierefreiheit/page.tsx anlegen (Route: /barrierefreiheit)',
        'Inhalt: Konformitätsstatus (z.B. "Teilweise konform mit WCAG 2.1 AA"), Datum der Erklärung',
        'Bekannte Einschränkungen auflisten (Lighthouse-Findings als Grundlage)',
        'Feedback-E-Mail angeben: z.B. barrierefreiheit@prodify.de (oder Kontaktformular)',
        'Verweis auf Durchsetzungsverfahren: Marktüberwachungsbehörde der Länder',
        'Footer-Link auf /barrierefreiheit ergänzen (neben Impressum und Datenschutz)',
      ],
      verification: 'Route /barrierefreiheit ist öffentlich erreichbar. Seite enthält Konformitätsstatus, Datum, bekannte Einschränkungen und Feedback-Kontakt. Footer-Link vorhanden.',
    },

  // ── Performance + Infra (added 2026-04-29) ─────────────────────────────────────────
  // ─── cat-7 — Performance ─────────────────────────────────────────────────
  
    {
      id: 'core-web-vitals',
      matchRuleIds: ['cat-7-rule-1'],
      matchMessagePatterns: [/LCP|FID|CLS|core.web.vital|largest.contentful|cumulative.layout/i],
      title: 'Core Web Vitals außerhalb Zielbereich — Lighthouse zeigt wo der Schmerz sitzt',
      problem:
        'LCP, FID oder CLS liegen über den Google-Zielwerten (LCP > 2,5 s, FID > 100 ms, CLS > 0,1). ' +
        'Das ist kein akademisches Problem: Google nutzt Core Web Vitals als Ranking-Signal, ' +
        'und jede zusätzliche Sekunde Ladezeit kostet messbar Conversion.',
      impact:
        'Schlechte Core Web Vitals kosten organischen Traffic und erhöhen Bounce-Rate. ' +
        'Bei LCP > 4 s verlassen ~25% der Nutzer die Seite bevor sie geladen ist.',
      strategy:
        'Lighthouse-Run gegen den Prod-Build (nicht Dev-Server) zeigt die konkreten Verursacher. ' +
        'LCP: großes Hero-Bild mit `priority`-Flag versehen, Server-Latenz senken. ' +
        'CLS: Bildgrößen im HTML explizit angeben (`width`/`height`), Fonts mit `display: swap`. ' +
        'FID/INP: lange JavaScript-Tasks aufteilen, Event-Handler leichtgewichtig halten.',
      firstStep:
        'Cursor-Prompt: \'Führe `pnpm build && pnpm start` aus, dann ' +
        '`pnpm exec lighthouse http://localhost:3000 --output json --output-path lighthouse-report.json`. ' +
        'Öffne die JSON-Ausgabe und liste alle Opportunities mit savings > 200 ms auf. ' +
        'Beginne mit dem größten LCP-Verursacher: prüfe ob das Hero-Image `<Image priority>` hat ' +
        'und ob der Server-Response-Time-Audit < 600 ms zeigt.\'',
      fixApproach: 'per-file',
      verification:
        'Lighthouse-Run gegen `pnpm start` zeigt LCP < 2,5 s, CLS < 0,1 und Performance-Score > 90.',
    },
  
    {
      id: 'bundle-size',
      matchRuleIds: ['cat-7-rule-2'],
      matchMessagePatterns: [/initial.*js.*kb|bundle.*kb|js.*\d+\s*kb|bundle.*size|initial.*bundle/i],
      title: 'Initial-Bundle zu groß — Ladezeit leidet auf mobilen Verbindungen',
      problem:
        'Der Initial-JS-Bundle überschreitet 400 KB. Jeder KB kostet Ladezeit, ' +
        'besonders auf mobilen Verbindungen. Tree-Shaking und Code-Splitting haben ' +
        'bei den meisten Next.js-Projekten noch erhebliches Potenzial.',
      impact:
        'Jede 100 ms Ladezeit kostet ca. 1% Conversion. Bei 1 MB Bundle auf 3G: ' +
        '8+ Sekunden bis Interactive — in diesem Zeitfenster verlässt ein Großteil der Nutzer die Seite.',
      strategy:
        '`ANALYZE=true pnpm build` zeigt die größten Chunks. ' +
        'Schwere Bibliotheken per `dynamic()` lazy laden (Syntax-Highlighter, Chart-Libraries, PDF-Renderer). ' +
        'Schwere Dependencies durch leichtere Alternativen ersetzen. ' +
        'Barrel-Exports (`index.ts` mit `export * from`) auflösen — sie verhindern Tree-Shaking.',
      firstStep:
        'Cursor-Prompt: \'Analysiere welche Imports in `src/` den Bundle am meisten vergrößern. ' +
        'Führe dazu `pnpm add -D @next/bundle-analyzer` aus, setze in `next.config.js` ' +
        '`ANALYZE=true` und führe `pnpm build` aus. ' +
        'Schlage vor, welche Imports > 50 KB per `dynamic(() => import(...), { ssr: false })` ' +
        'lazy geladen werden können — beginne mit dem größten Chunk.\'',
      fixApproach: 'per-file',
      verification:
        '`ANALYZE=true pnpm build` zeigt Initial-Bundle < 400 KB. ' +
        '`pnpm exec next info` zeigt keine First Load JS > 400 KB für kritische Routen.',
    },
  
    {
      id: 'pagination-missing',
      matchRuleIds: ['cat-7-rule-6'],
      matchMessagePatterns: [/pagination.*missing|paginier.*fehlt|no.*limit.*api|api.*no.*page|list.*endpoint.*no.*pag/i],
      title: 'Pagination fehlt in List-Endpunkten — ohne Limit wächst die Antwort mit den Daten',
      problem:
        'GET-Endpunkte die Listen zurückgeben, haben kein `limit`/`offset` oder Cursor-Pagination. ' +
        'Das funktioniert solange die Datenmenge klein ist — sobald eine Org hunderte Einträge hat, ' +
        'gibt jeder Request die gesamte Tabelle zurück: hohe Latenz, hohes Memory, hohes Timeout-Risiko.',
      impact:
        'Ohne Pagination ist jeder List-Endpunkt eine potenzielle Slow Query. ' +
        'Bei 10.000 Rows: Response-Time steigt, Vercel Function-Timeout droht, ' +
        'und der Client rendert unnötige Daten — ein Performance-Problem das mit den Daten wächst.',
      strategy:
        'Alle List-Routes mit `limit` + `offset` oder Cursor-Pagination ausstatten. ' +
        'Default-Limit: 50 Einträge. Supabase: `.range(offset, offset + limit - 1)`. ' +
        'Response immer mit `{ data: [], count: N, hasMore: bool }` strukturieren — ' +
        'einmal festlegen, dann konsistent durchhalten.',
      firstStep:
        'Cursor-Prompt: \'Öffne alle GET-API-Routen in `src/app/api/` die Supabase-List-Queries ' +
        'ausführen (`.select()` ohne `.eq()` auf ID). ' +
        'Füge zu jeder Route Query-Parameter `limit` (default 50, max 200) und `offset` (default 0) hinzu. ' +
        'Ersetze `.select("*")` durch `.select("*").range(offset, offset + limit - 1)`. ' +
        'Ergänze die Response mit `{ data, count, hasMore: offset + limit < count }`.\'',
      fixApproach: 'per-file',
      verification:
        'Jede List-API-Route akzeptiert `?limit=N&offset=M` und gibt `{ data, count, hasMore }` zurück. ' +
        'Kein Supabase `.select()` ohne `.range()` oder `.limit()` in List-Endpunkten.',
    },
  
    // ─── cat-10 — Testing ─────────────────────────────────────────────────────
  
    {
      id: 'unit-test-coverage',
      matchRuleIds: ['cat-10-rule-1'],
      matchMessagePatterns: [/coverage.*\d+.*%|test.*coverage|unit.*test.*missing|no.*test.*file/i],
      title: 'Unit-Test-Coverage unter 80% — kritische Pfade zuerst absichern',
      problem:
        'Die Test-Coverage liegt deutlich unter 80%. Das ist keine willkürliche Zahl: ' +
        'unter 80% Coverage sind kritische Business-Logik-Pfade (Auth, Budget, Billing) ' +
        'ohne Regressions-Schutz. Jedes Refactoring ist ein Blindflug.',
      impact:
        'Ohne Tests werden Regressions erst durch Nutzerfeedback oder Produktions-Fehler entdeckt. ' +
        'Je niedriger die Coverage, desto höher der Druck beim Refactoring — ' +
        'was wiederum verhindert, dass die Coverage steigt. Ein selbstverstärkender Kreislauf.',
      strategy:
        'Nicht das gesamte Projekt auf einmal testen — das wird nicht passieren. ' +
        'Stattdessen: die drei kritischsten `src/lib/`-Module identifizieren (Auth, Budget, API-Guards) ' +
        'und dort Unit-Tests schreiben bis jeder Branch abgedeckt ist. ' +
        'Coverage-Threshold in `vitest.config.ts` auf 80% setzen — Build schlägt dann bei Regression fehl.',
      firstStep:
        'Cursor-Prompt: \'Erstelle `src/lib/auth/__tests__/guards.test.ts` mit Unit-Tests für ' +
        '`requireOrgAdmin()` und `requireSuperadmin()` aus `src/lib/auth/guards.ts`. ' +
        'Teste alle Branching-Pfade: kein User, falscher Org-Role, korrekter Zugriff, Superadmin-Bypass. ' +
        'Nutze Vitest + `vi.mock()` für Supabase-Client. ' +
        'Führe danach `pnpm exec vitest run --coverage` aus und zeige die Coverage pro Datei.\'',
      fixApproach: 'per-file',
      verification:
        '`pnpm exec vitest run --coverage` zeigt >= 80% Statements-Coverage für `src/lib/`. ' +
        '`vitest.config.ts` hat `coverage.thresholds.statements: 80` gesetzt — CI schlägt bei Unterschreitung fehl.',
    },
  
    {
      id: 'ai-code-coverage-gate',
      matchRuleIds: ['cat-10-rule-5'],
      matchMessagePatterns: [/KI.code.gate|ai.*code.*gate|coverage.*gate.*90|90.*coverage.*gate/i],
      title: 'KI-Code-Gate: Coverage unter 90% — generierten Code sofort mit Tests absichern',
      problem:
        'KI-generierter Code landet ohne Test-Coverage in der Codebasis. ' +
        'Das ist das Gegenteil von dem was man mit KI erreichen will: ' +
        'schnelle Iteration ist nur sicher wenn eine Test-Suite sofort sagt, ob etwas gebrochen ist. ' +
        'Ohne Tests wird KI-Code zur Schuld statt zur Beschleunigung.',
      impact:
        'KI-Modelle halluzinieren Edge Cases — besonders bei Null-Handling, Leerlisten und Auth-Logik. ' +
        'Ohne Tests: jede KI-generierte Funktion ist ein Vertrauen-auf-den-ersten-Blick-Versprechen. ' +
        'Das funktioniert bis es nicht mehr funktioniert — und dann weißt du nicht warum.',
      strategy:
        'KI-Code und Test-Code immer im selben Schritt schreiben. ' +
        'Workflow: (1) KI generiert Funktion, (2) KI generiert Tests, (3) Coverage-Check vor dem Commit. ' +
        'Coverage-Gate bei 90% für neue Dateien in `src/lib/` — kein Merge ohne grüne Coverage.',
      firstStep:
        'Cursor-Prompt: \'Für jede neu erstellte oder stark modifizierte Datei in `src/lib/` ' +
        'erstelle eine entsprechende `__tests__/<dateiname>.test.ts`-Datei. ' +
        'Schreibe Tests für alle exportierten Funktionen: Happy Path, Fehlerfall, Edge Case (null, leer, maximal). ' +
        'Nutze Vitest. Ziel: >= 90% Statement-Coverage für die neue Datei. ' +
        'Führe nach dem Schreiben `pnpm exec vitest run --coverage src/lib/<dateiname>.ts` aus.\'',
      fixApproach: 'per-file',
      verification:
        'Jede neue Datei in `src/lib/` hat eine `__tests__/`-Entsprechung. ' +
        '`pnpm exec vitest run --coverage` zeigt >= 90% für neue KI-generierte Module.',
    },
  
    // ─── cat-11 — Rollback ───────────────────────────────────────────────────
  
    {
      id: 'rollback-plan-missing',
      matchRuleIds: ['cat-11-rule-3'],
      matchMessagePatterns: [/rollback.*plan|rollback.*fehlt|no.*rollback|deployment.*rollback/i],
      title: 'Rollback-Plan fehlt — Vercel kann in 30 Sekunden zurückrollen, das muss dokumentiert sein',
      problem:
        'Kein dokumentiertes Rollback-Verfahren. Vercel macht Rollbacks trivial — ' +
        'aber "klick irgendwo im Dashboard" ist keine Runbook-Anweisung. ' +
        'Im Ernstfall kostet fehlendes Wissen Minuten oder Stunden die der Ausfall dauert.',
      impact:
        'Ohne Rollback-Runbook steigt MTTR (Mean Time to Recover) deutlich. ' +
        'Für SaaS-Produkte gilt: jede Stunde Ausfall = Vertrauensverlust und potenzielle Kündigungen. ' +
        'Ein 30-Sekunden-Rollback der 10 Minuten dauert weil niemand weiß wie, ist kein Rollback.',
      strategy:
        'Ein einmaliges Runbook anlegen: wo das Rollback ausgelöst wird, welche DB-Migrations ' +
        'ggf. zurückgerollt werden müssen, wer benachrichtigt wird. ' +
        'Vercel-Rollback ist ein Klick — das Runbook erklärt nur, welcher Klick und was danach.',
      firstStep:
        'docs/runbooks/rollback.md anlegen mit: ' +
        '(1) Vercel-Rollback-Link (dashboard.vercel.com → dein Projekt → Deployments → vorige Version → Promote), ' +
        '(2) DB-Migrations-Rückgängigmachung wenn nötig (supabase db revert), ' +
        '(3) Checkliste nach Rollback (Smoke-Test, Monitoring prüfen, Team informieren).',
      fixApproach: 'documentation',
      manualSteps: [
        'docs/runbooks/ Verzeichnis anlegen falls noch nicht vorhanden',
        'docs/runbooks/rollback.md anlegen',
        'Vercel Dashboard URL deines Projekts eintragen: Deployments-Tab → "Promote to Production" Schritt erklären',
        'DB-Rollback-Verfahren dokumentieren: welche Migrations seit letztem stabilen Deploy neu hinzugekommen sind, wie man supabase migration revert nutzt',
        'Post-Rollback-Checkliste ergänzen: Smoke-Test-URLs, Monitoring-Dashboard-Link, Slack/E-Mail-Vorlage für Kunden',
        'Link auf rollback.md in README und CLAUDE.md unter "Incident Response" eintragen',
      ],
      verification:
        'docs/runbooks/rollback.md existiert, enthält Vercel-Rollback-Schritte, ' +
        'DB-Rollback-Verfahren und Post-Rollback-Checkliste. ' +
        'Ein neues Teammitglied kann damit ohne Rückfragen handeln.',
    },
  
    // ─── cat-12 — Observability / Error Monitoring ───────────────────────────
  
    {
      id: 'error-monitoring-missing',
      matchRuleIds: ['cat-12'],
      matchMessagePatterns: [/sentry|error.*monitor|observ|error.*track|no.*monitor|monitoring.*missing/i],
      title: 'Error Monitoring fehlt — Produktionsfehler bleiben unsichtbar bis Nutzer klagen',
      problem:
        'Kein Error-Monitoring-System (Sentry, Highlight, Datadog o.ä.) ist konfiguriert. ' +
        'Das bedeutet: Produktionsfehler passieren, ohne dass das Team es weiß. ' +
        'Der erste Hinweis auf ein Problem kommt vom Nutzer — nicht vom System.',
      impact:
        'Ohne Monitoring gibt es keine MTTR-Messung, keine Fehler-Raten, ' +
        'keine automatischen Alerts bei Spikes. Bugs in der Produktion sind unsichtbar. ' +
        'Im Schnitt werden Produktionsfehler ohne Monitoring 4–10x später entdeckt als mit.',
      strategy:
        'Sentry ist die einfachste Lösung für Next.js: `@sentry/nextjs` in 30 Minuten integriert. ' +
        'Kostenloses Tier reicht für Solo-Projekte. ' +
        'Wichtig: `captureException()` in catch-Blöcken nutzen — nicht nur den automatischen Error-Boundary-Wrapper.',
      firstStep:
        'Cursor-Prompt: \'Installiere `@sentry/nextjs` via `pnpm add @sentry/nextjs`. ' +
        'Führe `pnpm exec sentry-wizard -i nextjs` aus — das konfiguriert automatisch ' +
        '`sentry.client.config.ts`, `sentry.server.config.ts` und `sentry.edge.config.ts`. ' +
        'Setze `SENTRY_DSN` in `.env.local` und in Vercel Environment Variables. ' +
        'Prüfe danach in `src/lib/monitoring/index.ts` ob `captureException()` Sentry aufruft.\'',
      fixApproach: 'central-fix',
      verification:
        'Sentry-DSN ist als Env-Var gesetzt. `src/instrumentation.ts` oder `sentry.*.config.ts` existieren. ' +
        'Ein Test-Error via `throw new Error("test")` in einer API-Route erscheint im Sentry-Dashboard.',
    },
  
    // ─── cat-13 — Backup / PITR ──────────────────────────────────────────────
  
    {
      id: 'pitr-not-active',
      matchRuleIds: ['cat-13-rule-2'],
      matchMessagePatterns: [/PITR|point.in.time.*recover|pitr.*nicht.*aktiv|pitr.*not.*activ|backup.*DSGVO/i],
      title: '[DSGVO Art. 32] PITR nicht aktiv — Datenverlust-Risiko und Compliance-Lücke',
      problem:
        'Point-in-Time-Recovery ist auf dem Supabase-Projekt nicht aktiviert. ' +
        'Täglich erstellte Snapshots reichen für DSGVO Art. 32 nicht aus: ' +
        'ein Datenverlust-Ereignis zwischen zwei Snapshots bedeutet bis zu 24 Stunden verlorene Daten — ' +
        'inklusive Nutzerdaten die du technisch schützen musst.',
      impact:
        'DSGVO Art. 32 verpflichtet zu "angemessener Sicherstellung der Verfügbarkeit". ' +
        'Ohne PITR ist das Backup-RPO (Recovery Point Objective) bis zu 24 Stunden — ' +
        'für produktive Kundendaten nicht akzeptabel. ' +
        'Im Ernstfall: Datenverlust + DSGVO-Meldepflicht + Reputationsschaden.',
      strategy:
        'PITR auf Supabase Pro aktivieren (Supabase Dashboard → Database → Backups → PITR). ' +
        'PITR kostet $100/Monat zusätzlich auf dem Pro-Plan — für SaaS mit Kundendaten unverzichtbar. ' +
        'Danach: einen Restore-Test in ein separates Testprojekt durchführen und Ergebnis in docs/runbooks/ dokumentieren.',
      firstStep:
        'Supabase Dashboard → Database → Backups → "Point in Time Recovery" aktivieren (Pro-Plan erforderlich). ' +
        'Danach Aktivierungsdatum in docs/runbooks/disaster-recovery.md eintragen.',
      fixApproach: 'config-change',
      manualSteps: [
        'supabase.com → dein Projekt → Database → Backups öffnen',
        'Prüfen ob "Point in Time Recovery" aktiviert ist (Pro-Plan erforderlich)',
        'Falls nicht: Upgrade auf Pro-Plan oder PITR-Add-on aktivieren',
        'PITR-Retention-Window prüfen (empfohlen: mindestens 7 Tage)',
        'Restore-Test planen: separates Supabase-Testprojekt anlegen',
        'In docs/runbooks/disaster-recovery.md den PITR-Status + Aktivierungsdatum eintragen',
      ],
      verification:
        'Supabase Dashboard zeigt PITR als aktiv. ' +
        'docs/runbooks/disaster-recovery.md enthält PITR-Aktivierungsdatum und Retention-Window.',
    },
  
    // ─── cat-14 — Dependencies / Env ─────────────────────────────────────────
  
    {
      id: 'env-example-missing',
      matchRuleIds: ['cat-14-rule-7'],
      matchMessagePatterns: [/\.env\.example|env.*example.*fehlt|env.*example.*missing|no.*env.*example/i],
      title: '.env.example fehlt — neue Entwickler starten nicht ohne diese Datei',
      problem:
        '.env.example fehlt im Repository. Das bedeutet: wer das Projekt frisch klont, ' +
        'sieht nicht welche Umgebungsvariablen benötigt werden — und baut frustriert ' +
        'in einer kaputten Umgebung bis er alle Variablen aus dem Code zusammensucht.',
      impact:
        'Jedes Onboarding eines neuen Entwicklers kostet 30–90 Minuten extra — ' +
        'nur um herauszufinden welche Variablen fehlen. ' +
        'Gleichzeitig besteht das Risiko, dass tatsächliche Werte aus .env.local ' +
        'versehentlich committed werden wenn .env.example nie als Vorlage dient.',
      strategy:
        '.env.example anlegen mit allen Variablennamen die das Projekt braucht — ' +
        'Werte bleiben leer oder bekommen Platzhalter (`YOUR_VALUE_HERE`). ' +
        'Kein einziger echter Wert in die Datei — sie wird committed und ist öffentlich sichtbar.',
      firstStep:
        'Cursor-Prompt: \'Durchsuche alle Dateien in `src/`, `supabase/` und `next.config.js` ' +
        'nach `process.env.` und `Deno.env.get(`. ' +
        'Erstelle `.env.example` mit allen gefundenen Variablennamen als Schlüssel, ' +
        'Wert entweder leer oder mit `# Beschreibung woher der Wert kommt`. ' +
        'Füge in `.gitignore` explizit `.env.local` hinzu falls noch nicht vorhanden. ' +
        'Committe `.env.example` mit allen anderen Entwicklern als Ziel.\'',
      fixApproach: 'documentation',
      verification:
        '.env.example existiert im Root mit allen benötigten Variablennamen. ' +
        '.env.local ist in .gitignore eingetragen. ' +
        'Ein Entwickler kann mit .env.example als Vorlage alle benötigten Werte identifizieren.',
    },
  
    {
      id: 'core-dependencies-outdated',
      matchRuleIds: ['cat-14-rule-8'],
      matchMessagePatterns: [/major.*version.*veraltet|outdated.*major|react.*major|next.*major|core.*dep.*old/i],
      title: 'Core-Dependencies mit veralteten Major-Versionen — Sicherheitslücken schließen',
      problem:
        'Kern-Abhängigkeiten (React, Next.js, TypeScript) befinden sich nicht auf der aktuellen Major-Version. ' +
        'Major-Updates enthalten oft kritische Sicherheits-Patches die nicht in ältere Major-Versionen ' +
        'zurückportiert werden — wer auf einer alten Major-Version bleibt, bekommt diese Fixes nicht.',
      impact:
        'Bekannte CVEs in veralteten Versionen werden aktiv ausgenutzt. ' +
        'Next.js und React haben in jedem Major-Release Security-relevante Änderungen. ' +
        'Außerdem: Community-Support, neue Features und Performance-Verbesserungen ' +
        'sind nur in aktuellen Versionen verfügbar.',
      strategy:
        'Pro Major-Version: Changelog + Breaking Changes lesen, dann schrittweise migrieren. ' +
        'Nicht alles auf einmal — eine Dependency nach der anderen, mit Test-Durchlauf nach jedem Schritt. ' +
        'Automatisierte Tools: `pnpm outdated` zeigt alle veralteten Packages, ' +
        '`pnpm update --latest` updated auf neueste kompatible Versionen.',
      firstStep:
        'Cursor-Prompt: \'Führe `pnpm outdated` aus und liste alle Dependencies auf ' +
        'die eine neue Major-Version haben. ' +
        'Beginne mit der am einfachsten zu migrierenden (z.B. TypeScript — meist rückwärtskompatibel). ' +
        'Lies den offiziellen Migration Guide für die nächste Major-Version, ' +
        'update das Package und führe `pnpm exec tsc --noEmit` + `pnpm build` aus. ' +
        'Bei Fehlern: Breaking Changes beheben vor dem nächsten Package-Update.\'',
      fixApproach: 'config-change',
      verification:
        '`pnpm outdated` zeigt keine Core-Dependencies (react, next, typescript) mit ' +
        'veralteter Major-Version. `pnpm exec tsc --noEmit` und `pnpm build` laufen grün.',
    },

  // ── Dokumentation + API (added 2026-04-29) ─────────────────────────────────────────
  // ─── cat-5 — Database / Migrations ──────────────────────────────────────────
  
    {
      id: 'soft-delete-pattern',
      matchRuleIds: ['cat-5-rule-7'],
      matchMessagePatterns: [/soft.delete|deleted_at|hard.delete|DELETE FROM/i],
      title: 'Hard-Deletes statt Soft-Delete-Pattern — gelöschte Daten sind weg und kommen nicht zurück',
      problem:
        'Datensätze werden mit `DELETE FROM` endgültig aus der Datenbank entfernt. ' +
        'Versehentliche Löschungen durch Bugs oder User-Fehler sind dann nicht rückgängig zu machen — ' +
        'kein Audit-Trail, kein Undo, keine DSGVO-konforme Lösch-Dokumentation.',
      impact:
        'Jeder Bug der ein DELETE auslöst, vernichtet Produktionsdaten ohne Möglichkeit zur Wiederherstellung. ' +
        'DSGVO Art. 17 verlangt außerdem einen Nachweis der Löschung — der fehlt ohne Soft-Delete.',
      strategy:
        'Eine `deleted_at TIMESTAMPTZ` Spalte auf alle relevanten Tabellen migrieren. ' +
        '`DELETE`-Statements durch `UPDATE ... SET deleted_at = now()` ersetzen. ' +
        'Views oder Query-Filter (`WHERE deleted_at IS NULL`) schützen alle anderen Queries automatisch. ' +
        'Einmalige Migration pro Tabelle — danach kein Aufwand mehr.',
      firstStep:
        "Cursor-Prompt: 'Erstelle eine Supabase-Migration die `deleted_at TIMESTAMPTZ DEFAULT NULL` " +
        "auf alle Tabellen ohne diese Spalte hinzufügt. " +
        "Liste dann alle `DELETE FROM`-Statements im Code und schlage den `UPDATE ... SET deleted_at = now()`-Ersatz vor. " +
        "Für jede betroffene Query: Beispiel-SQL zeigen und die Route/Datei nennen.'",
      fixApproach: 'config-change',
      codeSnippets: [
        {
          code: `-- Migration: Soft-Delete auf Tabelle hinzufügen
  ALTER TABLE your_table ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
  
  -- Index für schnelle Filterung
  CREATE INDEX IF NOT EXISTS idx_your_table_deleted_at ON your_table(deleted_at)
    WHERE deleted_at IS NULL;
  
  -- Alle Queries brauchen danach:
  -- .is('deleted_at', null)  -- Supabase
  -- WHERE deleted_at IS NULL  -- raw SQL`,
          tool: 'Supabase SQL Editor',
          language: 'sql',
        },
      ],
      verification:
        'Keine `DELETE FROM`-Statements mehr in API-Routes (außer Admin-Bereinigung). ' +
        'Alle relevanten Tabellen haben `deleted_at`. ' +
        'Queries filtern mit `.is("deleted_at", null)`.',
    },
  
    {
      id: 'migration-naming',
      matchRuleIds: ['cat-5-rule-8'],
      matchMessagePatterns: [/migration.*naming|migrations.*inkonsistent|migration.*name/i],
      title: 'Migrations-Naming inkonsistent — beim Debugging kostet das echte Zeit',
      problem:
        'Migrations-Dateien folgen keiner einheitlichen Namenskonvention. ' +
        'Manche heißen `001_fix.sql`, andere `20260101000001_add_column.sql` oder einfach `add_thing.sql`. ' +
        'Bei 50+ Migrations ist die Reihenfolge und der Zweck ohne Zeitstempel oder konsistente Benennung nicht mehr nachvollziehbar.',
      impact:
        'Konflikte beim Merge von Feature-Branches, falsche Ausführungsreihenfolge, ' +
        'und stundenlanges Debugging wenn ein Hotfix die falsche Migration überschreibt.',
      strategy:
        'Supabase CLI Standard: `YYYYMMDDHHMMSS_beschreibung.sql`. ' +
        'Timestamp sorgt für deterministische Ausführungsreihenfolge. ' +
        'Beschreibung erklärt den Zweck in 3–5 Wörtern (snake_case). ' +
        'Legacy-Migrations einmalig umbenennen und via `supabase migration repair` als applied markieren.',
      firstStep:
        "Cursor-Prompt: 'Liste alle Migrations-Dateien in supabase/migrations/ mit ihren aktuellen Namen. " +
        "Identifiziere welche nicht dem Timestamp-Format `YYYYMMDDHHMMSS_name.sql` folgen. " +
        "Schlage für jede nicht-konforme Datei den neuen Namen vor. " +
        "Erkläre dann wie `supabase migration repair --status applied <version>` für umbenannte Migrations funktioniert.'",
      fixApproach: 'config-change',
      manualSteps: [
        'Alle Migrations-Dateien in supabase/migrations/ auflisten: `ls supabase/migrations/`',
        'Dateien ohne Timestamp-Prefix (Format: YYYYMMDDHHMMSS) identifizieren',
        'Für jede: `git mv supabase/migrations/old_name.sql supabase/migrations/20260101000001_old_name.sql`',
        'Wenn Migration schon applied: `supabase migration repair --status applied YYYYMMDDHHMMSS`',
        '`supabase db push` ausführen und prüfen, dass keine neue Migration unerwartet läuft',
      ],
      verification:
        'Alle Dateien in supabase/migrations/ folgen dem Muster `YYYYMMDDHHMMSS_*.sql`. ' +
        '`supabase migration list` zeigt alle als "applied" ohne Fehler.',
    },
  
    // ─── cat-6 / cat-7 — API Design ──────────────────────────────────────────────
  
    {
      id: 'api-versioning',
      matchRuleIds: ['cat-6-rule-1'],
      matchMessagePatterns: [/api.*version|versioning.*api|\/v1\/|\/v2\//i],
      title: 'API ohne Versionierung — Breaking Changes werden unvermeidlich zum Problem',
      problem:
        'Die API-Routen haben kein Versioning-Schema (`/api/v1/...`). ' +
        'Sobald externe Clients, Apps oder Integrationen die API nutzen, ' +
        'führt jede Breaking Change zu sofortigen Ausfällen — ohne Migrations-Pfad.',
      impact:
        'Kein Versioning bedeutet: entweder kein Refactoring oder gebrochene Clients. ' +
        'Beides kostet mehr als einmalig einen `/v1`-Prefix einzuführen.',
      strategy:
        'Alle API-Routes einmalig unter `/api/v1/` gruppieren. ' +
        'Bestehende Pfade per Next.js Rewrites weiterleiten damit alte Clients weiter funktionieren. ' +
        'Neue Features kommen direkt unter `/api/v1/`. ' +
        'Breaking Changes → `/api/v2/` mit Deprecation-Header auf v1.',
      firstStep:
        "Cursor-Prompt: 'Erstelle in `next.config.ts` Rewrites die alle `/api/*`-Pfade auf `/api/v1/*` weiterleiten. " +
        "Dann benenne den Ordner `src/app/api/` zu `src/app/api/v1/` um. " +
        "Prüfe dass kein interner Code `/api/` direkt referenziert — zeige alle Stellen die angepasst werden müssen.'",
      fixApproach: 'central-fix',
      verification:
        '`/api/v1/health` antwortet 200. Alle bisherigen `/api/`-Pfade leiten korrekt auf `/api/v1/` um. ' +
        'Response-Header enthält `API-Version: 1`.',
    },
  
    {
      id: 'api-timeouts',
      matchRuleIds: ['cat-6-rule-2'],
      matchMessagePatterns: [/api.*timeout|timeout.*api|fetch.*timeout|AbortController/i],
      title: 'Keine Request-Timeouts in API-Calls — ein hängender Upstream blockiert alles',
      problem:
        'Ausgehende HTTP-Requests (externe APIs, LLM-Calls, Feeds) haben keinen Timeout konfiguriert. ' +
        'Wenn ein externer Dienst langsam wird oder hängt, warten Serverless-Functions bis zum Platform-Limit — ' +
        'das kostet Budget und blockiert andere Requests.',
      impact:
        'Ein einziger hängender API-Call kann die gesamte Serverless-Function für 30–60 Sekunden blockieren. ' +
        'Bei mehreren gleichzeitigen Requests: Kosten-Explosion und User-facing Timeouts.',
      strategy:
        'Jeden ausgehenden `fetch()`-Call mit `AbortController` + `signal` absichern. ' +
        'Zentrale `fetchWithTimeout(url, opts, ms = 10000)`-Utility anlegen — ein Eingriff schützt alle Calls. ' +
        'LLM-Calls: Anthropic SDK hat `timeout`-Option — aktivieren.',
      firstStep:
        "Cursor-Prompt: 'Erstelle `src/lib/http/fetch-timeout.ts` mit einer `fetchWithTimeout(url, options, timeoutMs = 10000)`-Funktion. " +
        "Nutze `AbortController` + `setTimeout`. " +
        "Liste dann alle `fetch()`-Calls in `src/app/api/` die keinen `signal`-Parameter haben, " +
        "und schlage den Ersatz durch `fetchWithTimeout` vor.'",
      fixApproach: 'central-fix',
      verification:
        '`src/lib/http/fetch-timeout.ts` existiert. ' +
        'Alle externen `fetch()`-Calls in API-Routes nutzen `fetchWithTimeout` oder übergeben ein `AbortSignal`. ' +
        'Anthropic SDK-Calls haben `timeout: 30000` gesetzt.',
    },
  
    {
      id: 'api-pagination',
      matchRuleIds: ['cat-7-rule-6'],
      matchMessagePatterns: [/pagination|pagin|limit.*offset|cursor.*pagination|GET.*list.*without.*limit/i],
      title: 'List-Endpoints ohne Pagination — wächst die DB, wächst der Schmerz',
      problem:
        'GET-Endpoints die Listen zurückgeben, haben kein Limit oder Pagination. ' +
        'Bei 100 Einträgen ist das harmlos — bei 10.000 Einträgen lädt ein einziger Request ' +
        'die gesamte Tabelle in den Speicher und schickt sie an den Client.',
      impact:
        'Memory-Fehler in Serverless-Functions, lange Response-Zeiten, ' +
        'und ein Angreifer kann durch wiederholte Requests die DB unter Last setzen.',
      strategy:
        'Jeden List-Endpoint mit `limit` + `offset` oder Cursor-basierter Pagination absichern. ' +
        'Default-Limit: 50. Maximum-Limit: 200 (vom Server erzwungen, nicht vom Client). ' +
        'Supabase `.range(from, to)` oder `.limit(n)` — eine Zeile pro Query.',
      firstStep:
        "Cursor-Prompt: 'Finde alle GET-Routes in `src/app/api/` die `.select()` ohne `.limit()` oder `.range()` nutzen. " +
        "Für jede Route: füge `const limit = Math.min(Number(request.nextUrl.searchParams.get(\"limit\") ?? 50), 200)` und " +
        "`.limit(limit)` zur Query hinzu. " +
        "Zeige mir den Diff für die kritischste Route zuerst.'",
      fixApproach: 'per-file',
      verification:
        'Alle List-Endpoints akzeptieren `?limit=` und `?offset=` Query-Params. ' +
        'Server erzwingt `limit <= 200`. ' +
        'Kein `.select()` ohne `.limit()` in List-Routes.',
    },
  
    // ─── cat-15 — Design System ────────────────────────────────────────────────
  
    {
      id: 'component-library-undocumented',
      matchRuleIds: ['cat-15-rule-1'],
      matchMessagePatterns: [/component.*library.*undoc|design.system.*doc|storybook|component.*doc/i],
      title: 'Komponentenbibliothek nicht dokumentiert — jeder baut das Rad neu',
      problem:
        'Komponenten existieren im Code, aber es gibt keine dokumentierte Übersicht welche Komponenten existieren, ' +
        'welche Props sie erwarten und wie sie korrekt verwendet werden. ' +
        'Neue Entwickler erfinden Komponenten die es bereits gibt — oder nutzen sie falsch.',
      impact:
        'Inkonsistente UI, doppelter Code, und wachsende Abweichungen vom Design-System. ' +
        'Das kostet mehr als ein einmaliges Storybook-Setup.',
      strategy:
        'Eine zentrale `_DESIGN_REFERENCE.tsx`-Datei anlegen die alle wichtigen Komponenten mit Verwendungsbeispielen zeigt. ' +
        'Alternativ: Storybook für interaktive Dokumentation. ' +
        'Minimum: eine README in `src/components/` mit den wichtigsten Patterns.',
      firstStep:
        "Cursor-Prompt: 'Erstelle oder aktualisiere `src/components/_DESIGN_REFERENCE.tsx`. " +
        "Liste alle Komponenten in `src/components/ui/` mit: " +
        "(1) Komponenten-Name + Import-Pfad, " +
        "(2) Props-Tabelle (Prop, Typ, Default), " +
        "(3) minimales Verwendungsbeispiel als JSX-Kommentar. " +
        "Beginne mit den 10 am häufigsten importierten Komponenten.'",
      fixApproach: 'documentation',
      manualSteps: [
        '`src/components/_DESIGN_REFERENCE.tsx` anlegen (Cursor-Prompt oben nutzen)',
        'Für jede UI-Komponente: Props, Varianten und Verwendungsbeispiel eintragen',
        'Link in CLAUDE.md ergänzen: "VOR JEDEM UI-BUILD: Lies _DESIGN_REFERENCE.tsx"',
        'In PR-Template ergänzen: "Neue Komponente? → _DESIGN_REFERENCE.tsx aktualisieren"',
      ],
      verification:
        '`src/components/_DESIGN_REFERENCE.tsx` existiert und enthält mindestens 5 dokumentierte Komponenten mit Verwendungsbeispielen.',
    },
  
    {
      id: 'design-system-gaps',
      matchRuleIds: ['cat-15-rule-2'],
      matchMessagePatterns: [/design.system.*gap|design.system.*inconsisten|css.*var.*missing|design.token/i],
      title: 'Design-System-Lücken — Code und Design-Tokens laufen auseinander',
      problem:
        'Komponenten nutzen hartcodierte Farben, Abstände oder Schriftgrößen statt der definierten CSS-Variablen. ' +
        'Mit jeder neuen Komponente wächst die Abweichung — ein Theme-Wechsel oder Rebrand ' +
        'erfordert dann manuelles Durchsuchen des gesamten Codes.',
      impact:
        'Inkonsistentes UI das sich "komisch" anfühlt ohne dass Nutzer es benennen können. ' +
        'Jeder Rebrand kostet Wochen statt Minuten.',
      strategy:
        'Einmalig alle hartkodierten Werte durch CSS-Variablen ersetzen. ' +
        'CI-Check (`lint-design-system.mjs`) aktivieren der Hex-Farben und px-Hardcodes in Komponenten flaggt. ' +
        'Token-Palette in `globals.css` ist die einzige Quelle der Wahrheit.',
      firstStep:
        "Cursor-Prompt: 'Durchsuche alle `.tsx`-Dateien in `src/components/` nach inline `style={{`-Blöcken " +
        "die Hex-Farben (`#[0-9a-fA-F]{3,6}`) oder hartcodierte px-Werte für color/background/border enthalten. " +
        "Mappe jeden Wert auf die passende CSS-Variable aus `globals.css`. " +
        "Zeige mir die 10 häufigsten Abweichungen.'",
      fixApproach: 'per-file',
      verification:
        '`node scripts/ci/lint-design-system.mjs` läuft ohne Errors. ' +
        'Keine Hex-Farben in Komponenten-Dateien außerhalb von `globals.css`.',
    },
  
    // ─── cat-18 — Documentation ────────────────────────────────────────────────
  
    {
      id: 'readme-missing',
      matchRuleIds: ['cat-18-rule-1', 'cat-18-rule-7'],
      matchMessagePatterns: [/readme.*fehlt|readme.*missing|readme.*not.*found|kein.*readme/i],
      title: 'README fehlt oder veraltet — der erste Eindruck für jeden neuen Entwickler',
      problem:
        'Das Projekt hat keine README oder eine die zuletzt aktualisiert wurde als der Code noch anders aussah. ' +
        'Neue Entwickler lesen eine Beschreibung die nicht mehr stimmt — ' +
        'das kostet Onboarding-Zeit und Vertrauen.',
      impact:
        'Entwickler treffen falsche Annahmen über die Architektur. ' +
        'Setup-Fehler passieren weil die Schritte fehlen. ' +
        'Open-Source-Beiträge kommen nicht an weil niemand weiß wie man startet.',
      strategy:
        'Eine README mit vier Pflicht-Sektionen anlegen: Was ist das Projekt, wie richtet man es ein, ' +
        'wie entwickelt man, was sind die wichtigsten Architektur-Entscheidungen. ' +
        'Danach bei jedem größeren Feature-Commit kurz prüfen ob die README noch stimmt.',
      firstStep:
        "Cursor-Prompt: 'Lies den Quellcode in `src/` und erstelle eine `README.md` mit diesen Sektionen: " +
        "(1) Was ist das Projekt (1 Absatz), " +
        "(2) Tech-Stack (Tabelle: Technologie / Version / Zweck), " +
        "(3) Setup in 5 Schritten (pnpm install, env-Variablen, DB, Supabase, pnpm dev), " +
        "(4) Wichtigste Verzeichnisse mit Kurzbeschreibung, " +
        "(5) Häufige Befehle (audit, build, lint). " +
        "Nutze den tatsächlichen Stand im Code — keine Platzhalter.'",
      fixApproach: 'documentation',
      manualSteps: [
        'README.md anlegen oder öffnen (Cursor-Prompt oben nutzen)',
        'Setup-Schritte selbst durchgehen und korrigieren falls sie nicht funktionieren',
        'Link zu CLAUDE.md, docs/product/roadmap-2026-q2.md und docs/webapp-manifest/engineering-standard.md ergänzen',
        'Footer-Zeile: "Letztes Update: [Datum]" — als Erinnerung bei nächstem Review',
      ],
      verification:
        'README.md existiert. Enthält: Projektbeschreibung, Tech-Stack, Setup-Schritte, Key-Directories. ' +
        'Setup-Schritte führen auf einem frischen Checkout zu einem lauffähigen Dev-Server.',
    },
  
    {
      id: 'changelog-missing',
      matchRuleIds: ['cat-18-rule-8'],
      matchMessagePatterns: [/changelog.*fehlt|changelog.*missing|kein.*changelog|CHANGELOG/i],
      title: 'CHANGELOG fehlt — niemand weiß was sich wann geändert hat',
      problem:
        'Es gibt kein CHANGELOG.md. ' +
        'Wenn Kunden oder Entwickler wissen wollen was in einem Release enthalten war, ' +
        'müssen sie durch Git-Commits graben — das ist keine zumutbare User-Experience.',
      impact:
        'Support-Aufwand steigt wenn Nutzer nach Änderungen fragen. ' +
        'Keine Grundlage für Release-Notes oder Upgrade-Guides für externe Integrationen.',
      strategy:
        'Keep a Changelog-Format (keepachangelog.com): Unreleased → Released mit Datum. ' +
        'Kategorien: Added / Changed / Deprecated / Removed / Fixed / Security. ' +
        'Einmal anlegen, bei jedem Feature-PR mit 1–2 Zeilen befüllen.',
      firstStep:
        "Cursor-Prompt: 'Erstelle `CHANGELOG.md` im Keep-a-Changelog-Format (keepachangelog.com). " +
        "Schreibe eine `[Unreleased]`-Sektion mit den wichtigsten Features aus den letzten Git-Commits. " +
        "Nutze die Kategorien Added / Changed / Fixed / Security. " +
        "Füge einen Link zur Versionierungs-Policy und zum SemVer-Schema hinzu.'",
      fixApproach: 'documentation',
      manualSteps: [
        'CHANGELOG.md anlegen (Cursor-Prompt oben nutzen)',
        'Letzten 20 Git-Commits überfliegen: `git log --oneline -20`',
        'Wichtigste Changes in `[Unreleased]`-Sektion eintragen',
        'In PR-Template ergänzen: "CHANGELOG.md aktualisiert? [ ]"',
        'Beim nächsten Release: `[Unreleased]` → `[x.y.z] — YYYY-MM-DD` umbenennen',
      ],
      verification:
        'CHANGELOG.md existiert im Keep-a-Changelog-Format. ' +
        'Mindestens eine `[Unreleased]`-Sektion mit echten Einträgen vorhanden.',
    },
  
    {
      id: 'ki-kontext-missing',
      matchRuleIds: ['cat-18-rule-9'],
      matchMessagePatterns: [/claude\.md.*fehlt|cursorrules.*fehlt|CLAUDE\.md.*unvoll|ai.context.*missing/i],
      title: 'KI-Kontext-Datei fehlt oder unvollständig — Coding-Assistant trifft blinde Entscheidungen',
      problem:
        'CLAUDE.md oder .cursorrules fehlen, oder enthalten nur minimalen Inhalt. ' +
        'Ohne diese Datei kennt der KI-Assistent weder Tech-Stack, Konventionen, noch verbotene Patterns — ' +
        'und macht Vorschläge die zum Projekt passen könnten, es aber oft nicht tun.',
      impact:
        'Inkonsistente Code-Qualität, falsche Package-Empfehlungen, ' +
        'und Review-Aufwand für Änderungen die dem Stil des Projekts widersprechen.',
      strategy:
        'CLAUDE.md anlegen mit: Tech-Stack-Tabelle, Konventionen, Schlüssel-Dateien, ' +
        'verbotene Patterns und häufige Befehle. ' +
        'Die Datei wächst organisch — jede gemachte Entscheidung wird dokumentiert.',
      firstStep:
        "Cursor-Prompt: 'Erstelle eine `CLAUDE.md` für dieses Projekt. " +
        "Analysiere `package.json`, `tsconfig.json`, `src/`-Struktur und bestehende Konventionen. " +
        "Fülle diese Sektionen: (1) Tech-Stack-Tabelle, (2) Projektstruktur-Übersicht, " +
        "(3) Code-Konventionen (Naming, Error-Handling, DB-Zugriff), " +
        "(4) Verbotene Patterns, (5) Häufige Befehle. " +
        "Halte jeden Punkt konkret — keine generischen Empfehlungen.'",
      fixApproach: 'documentation',
      manualSteps: [
        'CLAUDE.md im Projekt-Root anlegen (Cursor-Prompt oben nutzen)',
        'Tech-Stack prüfen und aktualisieren (Versionen aus package.json)',
        'Drei wichtigste Konventionen des Projekts eintragen die ein KI-Assistent kennen muss',
        'Verbotene Patterns notieren: z.B. "Kein console.log in Produktion", "Kein direkt DB-Zugriff im Client"',
        'CLAUDE.md in .gitignore prüfen — sie gehört ins Repo, nicht ignoriert',
      ],
      verification:
        'CLAUDE.md existiert im Projekt-Root. ' +
        'Enthält mindestens: Tech-Stack, Projektstruktur, Konventionen, häufige Befehle.',
    },
  
    {
      id: 'prd-missing',
      matchRuleIds: ['cat-18-rule-10'],
      matchMessagePatterns: [/PRD.*fehlt|requirements.*missing|product.*requirements|anforderungen.*fehlen/i],
      title: 'PRD / Requirements fehlen — Features entstehen ohne klare Zieldefinition',
      problem:
        'Es gibt kein Product Requirements Document oder äquivalentes Dokument das beschreibt ' +
        'was das Produkt leisten soll, für wen, und was Erfolg bedeutet. ' +
        'Entscheidungen werden ad hoc getroffen — und oft später bereut.',
      impact:
        'Features werden gebaut die niemand braucht. ' +
        'Scope Creep ohne Gegengewicht. ' +
        'Onboarding neuer Entwickler dauert doppelt so lang weil das Produktziel nirgends steht.',
      strategy:
        'Ein schlankes PRD anlegen — kein 50-Seiten-Dokument, aber eine klare Antwort auf: ' +
        'Wer ist die Zielgruppe, welches Problem lösen wir, was sind die 3 Kern-Features, ' +
        'was ist explizit Out-of-Scope, wie messen wir Erfolg.',
      firstStep:
        "Cursor-Prompt: 'Erstelle `docs/product/prd.md` mit diesen Sektionen: " +
        "(1) Problem-Statement (2–3 Sätze: wer leidet, worunter), " +
        "(2) Zielgruppe (Primär / Sekundär / Nicht-Zielgruppe), " +
        "(3) Kern-Features MVP (max. 5 — jedes mit Acceptance Criteria), " +
        "(4) Explizites Out-of-Scope, " +
        "(5) Erfolgsmetriken (quantitativ), " +
        "(6) Offene Entscheidungen. " +
        "Nutze den bestehenden Code als Informationsquelle für den aktuellen Stand.'",
      fixApproach: 'documentation',
      manualSteps: [
        '`docs/product/prd.md` anlegen (Cursor-Prompt oben nutzen)',
        'Problem-Statement mit einem echten Kunden/Nutzer validieren — nicht nur intern',
        'Kern-Features priorisieren: Was ist MVP, was ist Phase 2?',
        'Erfolgsmetriken messbar formulieren (Zahlen, nicht "besser")',
        'In CLAUDE.md verlinken: "Vor neuen Features: prd.md lesen"',
      ],
      verification:
        '`docs/product/prd.md` existiert. ' +
        'Enthält: Problem, Zielgruppe, ≥3 priorisierte Features mit Acceptance Criteria, Erfolgsmetriken.',
    },
  
    {
      id: 'readme-drift',
      matchRuleIds: ['cat-18-rule-11'],
      matchMessagePatterns: [/readme.*drift|drift.*readme/i],
      title: 'README beschreibt nicht mehr was der Code tut',
      problem:
        'Die README wurde zuletzt aktualisiert als der Code noch anders aussah. ' +
        'Neue Entwickler lesen eine Beschreibung die nicht mehr stimmt — ' +
        'das kostet Onboarding-Zeit und Vertrauen.',
      impact:
        'Entwickler treffen falsche Annahmen über die Architektur. ' +
        'Onboarding dauert länger.',
      strategy:
        'README und Code parallel halten — bei jedem größeren Feature-Commit auch die README prüfen.',
      firstStep:
        "Cursor-Prompt: 'Vergleiche die README.md mit dem tatsächlichen Stand in src/. " +
        "Liste konkrete Stellen wo README und Code auseinanderlaufen. " +
        "Schlage aktualisierten Text vor.'",
      fixApproach: 'documentation',
      verification: 'README beschreibt korrekt: Tech-Stack, Architektur, Setup-Schritte.',
    },
  
    {
      id: 'cursorrules-no-stack',
      matchRuleIds: ['cat-18-rule-12'],
      matchMessagePatterns: [/cursorrules.*kein.*stack|cursorrules.*no.*tech|\.cursorrules.*unvollst/i],
      title: '.cursorrules enthält keinen Tech-Stack — der Assistent rät statt zu wissen',
      problem:
        '.cursorrules existiert, aber enthält keinen expliziten Tech-Stack-Abschnitt. ' +
        'Der KI-Assistent kann nicht sicher schlussfolgern ob er React oder Vue, ' +
        'Prisma oder Drizzle, pnpm oder npm empfehlen soll — ' +
        'und trifft Entscheidungen die zum Projekt passen könnten, es aber oft nicht tun.',
      impact:
        'Falsche Imports, falsche Package-Manager-Befehle, falsche ORM-Syntax — ' +
        'alles Review-Aufwand der vermeidbar ist.',
      strategy:
        'Tech-Stack-Sektion in .cursorrules oder CLAUDE.md ergänzen: ' +
        'Framework, Package-Manager, DB-Client, Auth-Library, Styling, wichtigste Packages. ' +
        'Konvention: pnpm exec statt npx, supabaseAdmin statt direktem DB-Zugriff, etc.',
      firstStep:
        "Cursor-Prompt: 'Lies `package.json` und `src/`-Struktur. " +
        "Erstelle einen `## Tech Stack`-Abschnitt für `.cursorrules` oder `CLAUDE.md` mit: " +
        "(1) Tabelle: Technologie / Version / Hinweis, " +
        "(2) Package-Manager und wichtigste CLI-Befehle, " +
        "(3) 5 Konventionen die jeder Assistent kennen muss. " +
        "Halte jeden Punkt auf den tatsächlichen Stand des Codes.'",
      fixApproach: 'documentation',
      manualSteps: [
        '.cursorrules oder CLAUDE.md öffnen',
        '`## Tech Stack`-Sektion anlegen (Cursor-Prompt oben nutzen)',
        'Package-Manager explizit nennen: pnpm (nicht npm/npx)',
        'DB-Zugriffs-Muster dokumentieren: z.B. "Kein Drizzle für Queries — supabaseAdmin nutzen"',
        'Drei häufigste Fehler die der Assistent bisher gemacht hat, als verbotene Patterns eintragen',
      ],
      verification:
        '.cursorrules oder CLAUDE.md enthält einen `## Tech Stack`-Abschnitt mit Framework, ' +
        'Package-Manager, DB-Client und mindestens 3 projektspezifischen Konventionen.',
    },
  
    // ─── cat-19 — Semantic Versioning ────────────────────────────────────────────
  
    {
      id: 'semver-missing',
      matchRuleIds: ['cat-19-rule-1'],
      matchMessagePatterns: [/semver.*fehlt|semantic.*version.*missing|keine.*version.*tag|git.*tag.*missing/i],
      title: 'Semantic Versioning fehlt — kein Überblick über den Release-Stand',
      problem:
        'Das Projekt hat keine Versionierung nach SemVer (MAJOR.MINOR.PATCH) und keine Git-Tags für Releases. ' +
        'Weder Kunden noch Entwickler können sagen welche Version produktiv läuft — ' +
        'oder was sich zwischen zwei Deployments geändert hat.',
      impact:
        'Kein strukturierter Rollback-Pfad. ' +
        'Support-Gespräche beginnen mit "welche Version haben Sie?" ohne Antwort. ' +
        'Externe Integrationen können keine Kompatibilitätsprüfung durchführen.',
      strategy:
        'SemVer einführen: `package.json` pflegen, Git-Tags bei jedem Release setzen. ' +
        'Regel: PATCH für Bugfixes, MINOR für neue Features (rückwärtskompatibel), MAJOR für Breaking Changes. ' +
        'Erstes Release: `1.0.0` oder `0.1.0` wenn noch pre-stable.',
      firstStep:
        "Cursor-Prompt: 'Prüfe den aktuellen `version`-Wert in `package.json`. " +
        "Wenn er `0.1.0` oder `1.0.0` ist: erkläre das SemVer-Schema und zeige wie man den ersten Git-Tag setzt. " +
        "Wenn er fehlt: setze `\"version\": \"0.1.0\"` und zeige den kompletten Release-Workflow: " +
        "version bump → CHANGELOG.md → git tag → git push --tags.'",
      fixApproach: 'config-change',
      manualSteps: [
        '`package.json` öffnen und `"version"` auf `"0.1.0"` oder aktuellen Stand setzen',
        'CHANGELOG.md anlegen oder aktualisieren (Abschnitt cat-18-rule-8)',
        'Ersten Git-Tag setzen: `git tag -a v0.1.0 -m "Initial release"`',
        '`git push --tags` ausführen',
        'In CI-Pipeline: Deployment-Step zeigt `npm_package_version` als Umgebungsvariable',
      ],
      verification:
        '`package.json` hat eine SemVer-kompatible `version`. ' +
        '`git tag -l` zeigt mindestens einen `v*.*.*`-Tag. ' +
        'CHANGELOG.md hat einen passenden Versions-Eintrag.',
    },
  
    {
      id: 'no-release-tags',
      matchRuleIds: ['cat-19-rule-2'],
      matchMessagePatterns: [/release.*tag.*fehlt|keine.*git.*tag|no.*release.*tag/i],
      title: 'Keine Git-Tags für Releases — kein Rollback-Anker vorhanden',
      problem:
        'Es gibt keine Git-Tags die Releases markieren. ' +
        'Bei einem Produktionsproblem gibt es keinen definierten Punkt zu dem man zurückrollen kann — ' +
        'nur einen endlosen Commit-Verlauf ohne Orientierung.',
      impact:
        'Rollbacks dauern länger weil der richtige Commit erst identifiziert werden muss. ' +
        'Kein klarer Deployment-Anker für Hotfix-Branches.',
      strategy:
        'Nach jedem Produktions-Deployment einen Git-Tag setzen: `git tag -a v1.2.3 -m "Release v1.2.3"`. ' +
        'Vercel Deployment-URL als Tag-Message speichern. ' +
        'Tag-Naming folgt SemVer — kein `release-2026-01-01` oder freie Strings.',
      firstStep:
        "Cursor-Prompt: 'Erstelle ein `scripts/release.sh`-Script das: " +
        "(1) die Version aus `package.json` liest, " +
        "(2) CHANGELOG.md prüft ob `[Unreleased]` Inhalt hat, " +
        "(3) `[Unreleased]` durch `[vX.Y.Z] - $(date +%Y-%m-%d)` ersetzt, " +
        "(4) `git tag -a vX.Y.Z -m \"Release vX.Y.Z\"` ausführt, " +
        "(5) `git push --tags` ausführt.'",
      fixApproach: 'config-change',
      manualSteps: [
        'Letzten stabilen Commit identifizieren: `git log --oneline -10`',
        'Ersten Tag setzen: `git tag -a v0.1.0 <commit-sha> -m "Initial stable release"`',
        '`git push --tags` ausführen',
        'Bei nächstem Deployment: Version in package.json bumpen, Tag setzen, pushen',
      ],
      verification:
        '`git tag -l | sort -V | tail -3` zeigt die letzten drei Releases. ' +
        'Jeder Tag hat eine aussagekräftige Message. ' +
        '`git show v0.1.0` zeigt den korrekten Commit.',
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
