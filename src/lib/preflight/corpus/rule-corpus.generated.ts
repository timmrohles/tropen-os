// AUTO-GENERIERT von generate-corpus-consolidate.ts — nicht von Hand editieren.
import type { ConventionRule } from './types'

export const GENERATED_CORPUS: ConventionRule[] = [
  {
    "id": "naming-i18n-keys-hierarchical",
    "section": "naming",
    "rule": "Benenne Übersetzungsschlüssel hierarchisch nach dem Muster feature.component.action (z.B. buttons.save.loading) statt flacher Strukturen.",
    "rationale": "Hierarchische Schlüssel erleichtern Pflege und Auffindbarkeit von Übersetzungen.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "naming-standard-prop-names",
    "section": "naming",
    "rule": "Verwende standardisierte Prop-Namen wie size, variant und disabled statt Varianten wie inputSize, theme oder isDisabled.",
    "rationale": "Konsistente Prop-Namen über Komponenten hinweg reduzieren kognitive Last und verbessern die Wiederverwendbarkeit.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "naming-log-event-schema",
    "section": "naming",
    "rule": "Benenne Log-Events nach dem Schema 'domain.action_result' (z.B. 'user.login_success') und gib Pflichtfelder je Event-Klasse mit (trace_id, duration_ms, error_type).",
    "rationale": "Einheitliche Event-Namen und Pflichtfelder ermöglichen konsistentes Logging und Auswertbarkeit.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "db-pitr-backup",
    "section": "db",
    "rule": "Aktiviere Point-in-Time Recovery mit mindestens 7 Tagen Aufbewahrung für alle Produktionsdatenbanken.",
    "rationale": "Ermöglicht Wiederherstellung nach Datenverlust oder fehlerhaften Operationen.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "db-reversible-migrations",
    "section": "db",
    "rule": "Versioniere Migrationen sequenziell und stelle für jede eine umkehrbare Down-Migration bereit.",
    "rationale": "Sichert kontrollierte Rollbacks und nachvollziehbare Schema-Historie.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "db-normalized-schema",
    "section": "db",
    "rule": "Entwirf Schemas in dritter Normalform ohne wiederholende Gruppen oder transitive Abhängigkeiten, sofern keine bewusste Denormalisierung begründet ist.",
    "rationale": "Reduziert Redundanz und Anomalien bei Datenänderungen.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "db-explain-analyze",
    "section": "db",
    "rule": "Prüfe performance-kritische Queries mit EXPLAIN ANALYZE vor dem Merge und lege unterstützende Indizes für WHERE-, ORDER-BY- und JOIN-Spalten an.",
    "rationale": "Verhindert langsame Queries und nicht genutzte Indizes in Produktion.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "db-erd-in-pr",
    "section": "db",
    "rule": "Reiche für neue Tabellen ein ERD oder DBML-Dokument als Teil des Pull Requests ein, bevor die Migration gemergt wird.",
    "rationale": "Macht Datenmodell-Änderungen reviewbar und dokumentiert.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "db-soft-delete",
    "section": "db",
    "rule": "Verwende in audit-kritischen und append-only-Tabellen ein Soft-Delete-Muster mit deleted_at-Timestamp statt Hard-DELETE.",
    "rationale": "Erhält Historie und ermöglicht Wiederherstellung.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "db-query-logging-n1-detector",
    "section": "db",
    "rule": "Aktiviere Query-Logging und integriere einen N+1-Detektor in die Testsuite.",
    "rationale": "Deckt ineffiziente Query-Muster früh automatisiert auf.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "db-list-pagination",
    "section": "db",
    "rule": "Sichere Listen-Endpunkte mit Paginierung (limit/offset oder Cursor) ab und lehne unbegrenzte Abfragen ab.",
    "rationale": "Verhindert unbegrenzte Datenmengen und Performance-Einbrüche.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "eh-no-leak-internals",
    "section": "error-handling",
    "rule": "Gib niemals Stack-Traces, DB-Details oder interne Pfade an den Client weiter und schreibe keine sensiblen Daten (Passwörter, Tokens) in Logs.",
    "rationale": "Verhindert Information-Leakage und schützt vor Angriffsflächen.",
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "eh-external-timeout",
    "section": "error-handling",
    "rule": "Sichere alle externen Aufrufe (fetch, DB-Queries, SDK-Calls) mit einem Timeout über AbortController oder Library-Option ab.",
    "rationale": "Verhindert hängende Requests und Ressourcen-Leaks.",
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "eh-retry-backoff",
    "section": "error-handling",
    "rule": "Wiederhole transiente Fehler (Netzwerk, Rate-Limit) mit exponentiellem Backoff und einem maximalen Retry-Limit.",
    "rationale": "Erhöht Resilienz ohne Überlastung der Gegenseite.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "eh-circuit-breaker",
    "section": "error-handling",
    "rule": "Setze für kritische externe Abhängigkeiten ein Circuit-Breaker-Pattern mit Fallback ein, das bei wiederholten Fehlern umschaltet.",
    "rationale": "Schützt das System vor kaskadierenden Ausfällen.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "eh-severity-logging",
    "section": "error-handling",
    "rule": "Klassifiziere Fehler nach Schweregrad (FATAL/ERROR/WARNING/INFO) und logge mit dem passenden Level — erwartetes Nutzerverhalten als INFO, nicht als ERROR.",
    "rationale": "Hält Alerts aussagekräftig und reduziert Rauschen.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "eh-validate-ai-output",
    "section": "error-handling",
    "rule": "Validiere alle KI-Ausgaben vor der Weiterverarbeitung mit einem Schema und speichere oder rendere rohe AI-Responses nie direkt.",
    "rationale": "Modell-Ausgaben sind unzuverlässig und potenziell unsicher.",
    "appliesWhen": [
      "ai:true"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "eh-ai-fallback",
    "section": "error-handling",
    "rule": "Sichere jeden KI-Service-Aufruf mit einer Fallback-Strategie (alternativer Provider, Circuit-Breaker oder gecachte Antwort) ab.",
    "rationale": "AI-Provider sind häufig instabil oder rate-limitiert.",
    "appliesWhen": [
      "ai:true"
    ],
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "eh-optimistic-rollback",
    "section": "error-handling",
    "rule": "Versehe optimistische UI-Updates mit einem onError-Rollback-Handler, der den vorherigen Zustand wiederherstellt.",
    "rationale": "Verhindert inkonsistente UI bei fehlgeschlagenen Mutationen.",
    "appliesWhen": [
      "stack:react"
    ],
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "testing-load-testing",
    "section": "testing",
    "rule": "Stelle Load-Test-Skripte (k6, Locust, Artillery, JMeter) für kritische Pfade mit mindestens 100 concurrent Users bereit und führe sie vor jedem Production-Launch aus.",
    "rationale": "Performance-Regressionen werden vor dem Release sichtbar.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "testing-load-thresholds",
    "section": "testing",
    "rule": "Definiere messbare Schwellenwerte in Load-Test-Konfigurationen (z. B. p95-Latenz < 500 ms, Fehlerrate < 1 %) und dokumentiere Szenarien, Baseline und Bottlenecks vor jedem Major-Release.",
    "rationale": "Ohne klare Zielmetriken sind Lasttest-Ergebnisse nicht bewertbar.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "testing-load-in-ci",
    "section": "testing",
    "rule": "Binde Load-Tests in die CI/CD-Pipeline ein, sodass sie automatisch vor einem Release-Deployment laufen.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "testing-ci-required-checks",
    "section": "testing",
    "rule": "Konfiguriere CI so, dass fehlschlagende Tests einen Merge in den Haupt-Branch als required status check blockieren.",
    "rationale": "Verhindert, dass defekter Code in die Hauptlinie gelangt.",
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "testing-coverage-and-regression",
    "section": "testing",
    "rule": "Erzwinge mindestens 80 % Testabdeckung für neue oder geänderte Geschäftslogik und sichere jeden Bugfix mit einem Regressionstest ab, der vor dem Fix fehlschlägt und danach besteht.",
    "rationale": "Coverage-Mindestmaß und Regressionstests verhindern Wiederholungsfehler.",
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "testing-pyramid",
    "section": "testing",
    "rule": "Halte die Testpyramide ein: mehrheitlich Unit-Tests, moderate Integrationstests, wenige E2E-Tests.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "testing-restore-tests",
    "section": "testing",
    "rule": "Führe quartalsweise automatisierte Restore-Tests durch und dokumentiere die Ergebnisse.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "testing-node-load-script",
    "section": "testing",
    "rule": "Definiere einen 'test:load'-Script-Eintrag in package.json, der den Load-Test ausführt.",
    "severity": "should",
    "appliesWhen": [
      "stack:node"
    ],
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "testing-db-real-db-integration",
    "section": "testing",
    "rule": "Führe API-Integrationstests gegen eine echte Test-Datenbank aus, nicht gegen Mocks oder In-Memory-Fakes.",
    "rationale": "Echte DB-Verhalten und Constraints werden nur so verifiziert.",
    "severity": "should",
    "appliesWhen": [
      "db:true"
    ],
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "testing-db-factories",
    "section": "testing",
    "rule": "Generiere Testdaten ausschließlich über Factories — niemals Produktionsdaten, hartkodierte IDs oder sensible Felder in Fixtures.",
    "severity": "must",
    "appliesWhen": [
      "db:true"
    ],
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "testing-ai-generated-coverage",
    "section": "testing",
    "rule": "Versieh KI-generierten Code mit mindestens 90 % Testabdeckung und einem zusätzlichen Security-Review.",
    "severity": "must",
    "appliesWhen": [
      "ai:true"
    ],
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "testing-e2e-critical-paths",
    "section": "testing",
    "rule": "Decke kritische Benutzerpfade (Registrierung, Login, Checkout) mit E2E-Tests in produktionsnaher Umgebung ab.",
    "severity": "must",
    "appliesWhen": [
      "platform:web",
      "platform:native",
      "auth:true"
    ],
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "git-no-force-push-protected",
    "section": "git",
    "rule": "Führe niemals Force-Pushes auf geschützte Branches (main, release/*) aus und nutze stattdessen git revert.",
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "git-pr-review",
    "section": "git",
    "rule": "Bringe Änderungen an geschützten Branches nur über Pull Requests mit mindestens einem Review ein.",
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "git-conventional-commits",
    "section": "git",
    "rule": "Formatiere Commits nach dem Conventional-Commits-Standard (type(scope): subject) mit aussagekräftiger Zusammenfassung und optionalem Body, der Absicht und Kontext beschreibt.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "git-atomic-commits",
    "section": "git",
    "rule": "Beschränke jeden Commit auf eine einzige logische Änderung.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "git-commit-lockfiles",
    "section": "git",
    "rule": "Committe Lockfiles (package-lock.json, yarn.lock, pnpm-lock.yaml) und installiere in CI mit --frozen-lockfile.",
    "severity": "must",
    "appliesWhen": [
      "stack:node"
    ],
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-prompt-injection",
    "section": "security",
    "rule": "User-Input niemals in System-Prompts interpolieren — stets als separate Nachricht mit Rolle 'user' übergeben.",
    "rationale": "Verhindert Prompt-Injection.",
    "appliesWhen": [
      "ai:true"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-llm-rate-limit",
    "section": "security",
    "rule": "Alle LLM- und KI-Endpunkte mit per-User- und globalem Rate-Limit absichern.",
    "rationale": "Begrenzt Missbrauch und Kosten.",
    "appliesWhen": [
      "ai:true"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-llm-output-sink",
    "section": "security",
    "rule": "LLM-Ausgaben niemals an eval() oder innerHTML übergeben — HTML mit DOMPurify sanitisieren und Code nur in isolierter Sandbox transformieren.",
    "rationale": "Verhindert XSS und Code-Execution durch generierte Inhalte.",
    "appliesWhen": [
      "ai:true"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-ai-dep-review",
    "section": "security",
    "rule": "Jede von einem KI-Tool vorgeschlagene Abhängigkeit vor dem Merge manuell auf Paketname, Maintainer-Reputation und Security-Scan prüfen.",
    "rationale": "Schützt vor halluzinierten oder bösartigen Paketen.",
    "appliesWhen": [
      "ai:true"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-no-pii-analytics",
    "section": "security",
    "rule": "Keine PII (E-Mails, Namen, rohe User-IDs) in Analytics-Events senden — ausschließlich pseudonymisierte Identifier verwenden.",
    "rationale": "Minimiert Datenexposition in Drittsystemen.",
    "severity": "must",
    "source": "agent:ANALYTICS"
  },
  {
    "id": "sec-webhook-signature",
    "section": "security",
    "rule": "Webhook-Handler müssen HMAC/Signatur validieren, bevor der Request-Body verarbeitet wird.",
    "rationale": "Verhindert gefälschte Requests.",
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-error-leak",
    "section": "security",
    "rule": "Interne Systemdetails, Stack Traces, Hostnamen oder SQL-Fehlermeldungen niemals in nutzersichtbaren Fehlertexten weitergeben.",
    "rationale": "Verhindert Information Disclosure.",
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-no-dynamic-eval",
    "section": "security",
    "rule": "eval() und new Function() mit dynamischem oder nutzergesteuertem Input vollständig verbieten — JSON.parse() für Daten und AST-Transforms für Code verwenden.",
    "rationale": "Verhindert Code-Injection.",
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-crypto-standards",
    "section": "security",
    "rule": "Passwörter mit bcrypt (Cost ≥ 12) oder Argon2 hashen, Tokens/Salts via CSPRNG (crypto.randomUUID/getRandomValues) erzeugen und keine eigene Kryptografie implementieren.",
    "rationale": "Schwache Hashes und Math.random sind angreifbar.",
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-ssrf-allowlist",
    "section": "security",
    "rule": "Nutzerkontrollierte URLs nie direkt an fetch/axios übergeben — vorher gegen eine strikte Allowlist validieren.",
    "rationale": "Verhindert SSRF.",
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-consent-analytics",
    "section": "security",
    "rule": "Jeden analytics.track()-Aufruf und Session-Recording-Tools hinter separate Consent-Prüfungen kapseln — allgemeine Analytics-Einwilligung deckt Session-Recording nicht ab.",
    "rationale": "Verhindert unzulässiges Tracking.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:ANALYTICS"
  },
  {
    "id": "sec-server-client-split",
    "section": "security",
    "rule": "Server-only-Code niemals in Client-Bundles importieren und Client-only-Code nicht serverseitig ausführen — geteilten Code in einem dedizierten Shared-Verzeichnis ablegen.",
    "rationale": "Verhindert Secret-Leaks und Bundle-Fehler.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-headers",
    "section": "security",
    "rule": "Baseline-Security-Header (CSP, HSTS, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy) zentral konfigurieren und in allen Responses ausliefern.",
    "rationale": "Härtet Browser gegen gängige Angriffe.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-rate-limit-public",
    "section": "security",
    "rule": "Rate-Limiting für alle öffentlichen und auth-relevanten Endpunkte durchsetzen; Auth-Endpunkte am restriktivsten begrenzen.",
    "rationale": "Schützt vor Brute-Force und Abuse.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-cors",
    "section": "security",
    "rule": "CORS nur für explizit aufgelistete Origins erlauben; niemals Wildcard (*) in Produktion verwenden.",
    "rationale": "Verhindert Cross-Origin-Datenabfluss.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-session-cookies",
    "section": "security",
    "rule": "Session-Cookies mit HttpOnly, Secure und SameSite=Lax/Strict konfigurieren und Tokens/JWTs/Session-IDs nie in localStorage speichern.",
    "rationale": "Schützt Tokens vor XSS-Diebstahl.",
    "appliesWhen": [
      "platform:web",
      "auth:true"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-rls",
    "section": "security",
    "rule": "Row Level Security für jede Tabelle mit nutzerbezogenen Daten aktivieren und explizite Policies definieren, bevor die Tabelle produktiv genutzt wird.",
    "rationale": "Erzwingt Datenisolation auf DB-Ebene.",
    "appliesWhen": [
      "db:true",
      "auth:true"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-pseudonym-id",
    "section": "security",
    "rule": "Nutzer-Identifier in Events ausschließlich über einen zentralen Pseudonymisierungsdienst ableiten — rohe Datenbank-IDs oder E-Mails sind verboten.",
    "rationale": "Verhindert Re-Identifikation.",
    "appliesWhen": [
      "auth:true"
    ],
    "severity": "must",
    "source": "agent:ANALYTICS"
  },
  {
    "id": "sec-sql-injection",
    "section": "security",
    "rule": "Nutzereingaben nie per String-Interpolation in SQL-, NoSQL- oder Shell-Queries einbauen — ausschließlich parametrisierte Abfragen oder ORM-Methoden verwenden.",
    "rationale": "Verhindert Injection.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-no-mass-assign",
    "section": "security",
    "rule": "Bei Datenbank-Updates req.body nie direkt spreaden — nur explizit aufgelistete Felder per Destructuring übernehmen.",
    "rationale": "Verhindert Mass-Assignment.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-dep-audit",
    "section": "security",
    "rule": "Abhängigkeiten in CI mit Audit (--audit-level=critical) und Supply-Chain-Scanner (socket.dev/Snyk) auf CVEs, Malware und Typosquatting prüfen.",
    "rationale": "Verhindert verwundbare oder bösartige Dependencies.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-sbom",
    "section": "security",
    "rule": "Im Production-Build ein SBOM (CycloneDX oder Syft) mit Abhängigkeiten, Versionen und Lizenzen erzeugen.",
    "rationale": "Schafft Transparenz über die Lieferkette.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-path-traversal",
    "section": "security",
    "rule": "Dateisystem-Operationen dürfen keine nutzerkontrollierten Pfade ohne path.resolve()-Validierung und Allowlist-Prüfung akzeptieren.",
    "rationale": "Verhindert Path Traversal.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "sec-build-provenance",
    "section": "security",
    "rule": "Container-Images und veröffentlichte Pakete kryptografisch signieren und mit Build-Provenance versehen (sigstore/cosign, npm provenance).",
    "rationale": "Sichert Artefakt-Integrität.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "maint-adr",
    "section": "maintenance",
    "rule": "Dokumentiere signifikante Architekturentscheidungen als ADR in docs/adr/ mit Was, Warum, Alternativen und Konsequenzen.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "maint-api-docs",
    "section": "maintenance",
    "rule": "Dokumentiere jeden neuen öffentlichen Endpunkt mit einer OpenAPI/Swagger-Spezifikation und halte README sowie Tech-Stack-Angaben mit dem tatsächlichen Code synchron.",
    "rationale": "Aktuelle Dokumentation reduziert Onboarding- und Wartungsaufwand.",
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "maint-semver-deprecation",
    "section": "maintenance",
    "rule": "Vergib Versionsnummern strikt nach Semantic Versioning und versieh jede @deprecated-Annotation mit Migrationsziel-Version, Nachfolger und Link zum Migrationsleitfaden.",
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "maint-observability",
    "section": "maintenance",
    "rule": "Erfasse die vier Golden Signals (Traffic, Fehlerrate, Latenz p50/p95/p99, Kapazität) für alle produktiven Deployments in einem Dashboard und versieh jeden Alert mit Bedingung, Schwellenwert, Dauer und konkreter Response-Aktion.",
    "rationale": "Ohne Messbarkeit und definierte Reaktionen ist Betrieb nicht wartbar.",
    "severity": "must",
    "source": "agent:OBSERVABILITY"
  },
  {
    "id": "maint-incident-dr",
    "section": "maintenance",
    "rule": "Dokumentiere einen Incident-Response-Prozess (Detect → Assess → Mitigate → Resolve → Document) mit versionierten Runbooks und prüfe DR-Runbooks samt RTO/RPO mindestens alle 90 Tage mit datiertem Testvermerk.",
    "severity": "must",
    "source": "agent:RELIABILITY"
  },
  {
    "id": "maint-iac",
    "section": "maintenance",
    "rule": "Führe alle Infrastruktur- und Staging-Änderungen ausschließlich versioniert über genehmigte IaC-Tools (Terraform, Pulumi, CDK) durch — manuelle Cloud-Console-Änderungen in Produktion sind verboten.",
    "severity": "must",
    "source": "agent:INFRA"
  },
  {
    "id": "maint-backup-3-2-1",
    "section": "maintenance",
    "rule": "Halte die 3-2-1-Backup-Regel ein und konfiguriere Cross-Region-Replikation mit mindestens einer sekundären Region für alle produktiven Speicher.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:RELIABILITY"
  },
  {
    "id": "maint-pitr",
    "section": "maintenance",
    "rule": "Aktiviere Point-in-Time Recovery (PITR) in der Datenbankinfrastruktur und führe regelmäßig einen Restore-Test durch.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:RELIABILITY"
  },
  {
    "id": "maint-rollback",
    "section": "maintenance",
    "rule": "Implementiere einen automatisierten Rollback-Mechanismus, teste ihn in Staging und stelle sicher, dass der gesamte Prozess unter 5 Minuten abschließt.",
    "severity": "should",
    "source": "agent:INFRA"
  },
  {
    "id": "maint-scaling-loadtest",
    "section": "maintenance",
    "rule": "Pflege ein Scaling-Runbook mit priorisierten Bottlenecks, Schwellwerten und Skalierungsbefehlen und dokumentiere Load-Test-Ausführung in docs/load-testing.md.",
    "severity": "should",
    "source": "agent:INFRA"
  },
  {
    "id": "maint-cost-alerts",
    "section": "maintenance",
    "rule": "Konfiguriere Budget-Alerts für Cloud- und LLM-Dienste mit Schwellenwerten bei 50%, 80% und 100% des Limits.",
    "severity": "should",
    "source": "agent:INFRA"
  },
  {
    "id": "maint-vendor-exit",
    "section": "maintenance",
    "rule": "Dokumentiere Vendor-Lock-in-Risiken und Exit-Strategien mit Migrationsschritten, Daten-Export und Zeitschätzung unter docs/exit-strategies/.",
    "severity": "should",
    "source": "agent:ARCHITECTURE"
  },
  {
    "id": "maint-node-version-pin",
    "section": "maintenance",
    "rule": "Pinne die Node.js-Version exakt in .nvmrc und package.json engines — keine Ranges wie >=16.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "maint-node-dep-bot",
    "section": "maintenance",
    "rule": "Konfiguriere Dependabot oder Renovate, um Sicherheitsupdates sofort und Minor-Updates wöchentlich gebündelt einzuspielen.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "maint-component-docs",
    "section": "maintenance",
    "rule": "Liefere jede öffentliche Komponente mit JSDoc-Beschreibung und zugehöriger Storybook-Story aus und benenne gleichartige UI-Aktionen konsistent über ein gepflegtes Glossary.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "should",
    "source": "agent:CODE_STYLE"
  },
  {
    "id": "maint-analytics-catalog",
    "section": "maintenance",
    "rule": "Dokumentiere neue Analytics-Events mit Zweck, Schema-Version und Business-Kontext in einem zentralen Event-Katalog.",
    "severity": "should",
    "source": "agent:OBSERVABILITY"
  },
  {
    "id": "maint-ai-cache",
    "section": "maintenance",
    "rule": "Sichere teure oder häufig wiederholte KI-Aufrufe mit einem Cache (z. B. Redis, normalisierte Prompt-Keys, dokumentierter TTL) ab.",
    "appliesWhen": [
      "ai:true"
    ],
    "severity": "should",
    "source": "agent:AI"
  },
  {
    "id": "maint-ai-context-file",
    "section": "maintenance",
    "rule": "Pflege eine substantielle KI-Kontext-Datei (.cursorrules, CLAUDE.md o.ä.) mit mindestens 200 Zeichen und explizit angegebenem Tech-Stack.",
    "appliesWhen": [
      "ai:true"
    ],
    "severity": "should",
    "source": "agent:AI"
  }
]
