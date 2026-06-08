// C2-Komitee-Roh-Output (217 Regeln) — Input für die C2b-Konsolidierung. Nicht von Hand pflegen.
import type { ConventionRule } from '@/lib/preflight/corpus/types'

export const RAW_RULES: ConventionRule[] = [
  {
    "id": "a11y-form-labels",
    "section": "code-rules",
    "rule": "Versieh jedes Formular-Control mit einem zugänglichen Namen über htmlFor/id, aria-label oder aria-labelledby.",
    "rationale": "Screen-Reader-Nutzer können den Zweck von Feldern ohne korrekte Labels nicht ermitteln.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:ACCESSIBILITY_AGENT"
  },
  {
    "id": "a11y-color-contrast",
    "section": "code-rules",
    "rule": "Halte WCAG-2.1-AA-Kontrastverhältnisse ein (mindestens 4,5:1 für Normaltext, 3:1 für Großtext) und prüfe sie mit axe-core in der CI.",
    "rationale": "Unzureichender Kontrast macht Inhalte für Sehbeeinträchtigte unlesbar.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:ACCESSIBILITY_AGENT"
  },
  {
    "id": "a11y-image-alt",
    "section": "code-rules",
    "rule": "Versieh informative Bilder mit aussagekräftigem alt-Text und markiere dekorative Bilder mit alt=\"\".",
    "rationale": "Screen-Reader können visuelle Inhalte ohne Text-Alternativen nicht interpretieren.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:ACCESSIBILITY_AGENT"
  },
  {
    "id": "a11y-keyboard-and-focus",
    "section": "code-rules",
    "rule": "Mache alle interaktiven Elemente per Tastatur bedienbar und behalte sichtbare Fokus-Indikatoren bei.",
    "rationale": "Tastaturnutzer müssen alle Funktionen ohne Maus bedienen und dem Fokus visuell folgen können.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:ACCESSIBILITY_AGENT"
  },
  {
    "id": "a11y-semantic-landmarks-and-skip-link",
    "section": "structure",
    "rule": "Verwende semantische Landmark-Elemente (header, nav, main, footer) mit maximal einem main pro Seite und stelle einen fokussierbaren Skip-Link als erstes Element bereit.",
    "rationale": "Tastatur- und Screen-Reader-Nutzer benötigen Landmark-Navigation und Bypass-Blöcke gemäß WCAG 2.4.1.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:ACCESSIBILITY_AGENT"
  },
  {
    "id": "a11y-heading-hierarchy",
    "section": "structure",
    "rule": "Verwende Überschriftenebenen sequenziell ohne Sprünge (h1→h2→h3) und überspringe keine Ebene.",
    "rationale": "Screen-Reader navigieren per Überschriften; Lücken erzeugen verwirrende Dokumentgliederungen.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:ACCESSIBILITY_AGENT"
  },
  {
    "id": "a11y-touch-target",
    "section": "code-rules",
    "rule": "Dimensioniere interaktive Elemente auf mindestens 44×44 CSS-Pixel Touch-Target-Größe.",
    "rationale": "Zu kleine Ziele sind für Nutzer mit motorischen Einschränkungen schwer zu treffen.",
    "appliesWhen": [
      "platform:web",
      "platform:native"
    ],
    "severity": "must",
    "source": "agent:ACCESSIBILITY_AGENT"
  },
  {
    "id": "a11y-reduced-motion",
    "section": "code-rules",
    "rule": "Deaktiviere oder reduziere Animationen stark mit @media (prefers-reduced-motion: reduce).",
    "rationale": "Exzessive Bewegtinhalte können bei Nutzern mit vestibulären Störungen Schwindel oder Übelkeit auslösen.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "should",
    "source": "agent:ACCESSIBILITY_AGENT"
  },
  {
    "id": "quality-required-sections",
    "section": "maintenance",
    "rule": "Jedes Agent-Dokument muss alle Pflichtabschnitte enthalten: Meta (YAML), Purpose, Applicability, Rules, Exceptions, Checklist und Tool Integration.",
    "rationale": "Fehlende Abschnitte verhindern das automatisierte Parsen durch review-agents.ts und erzeugen stille Enforcement-Lücken.",
    "severity": "must",
    "source": "agent:AGENT_QUALITY_AGENT"
  },
  {
    "id": "quality-rule-severity-label",
    "section": "maintenance",
    "rule": "Jede Regel muss im Heading ein Severity-Label ([BLOCKER|CRITICAL|WARNING]) und ein Enforcement-Label ([BLOCKED|PREVENTED|REVIEWED|ADVISORY]) tragen.",
    "rationale": "Ohne Labels kann das Audit-Scoring-System Findings nicht korrekt gewichten.",
    "severity": "must",
    "source": "agent:AGENT_QUALITY_AGENT"
  },
  {
    "id": "quality-rule-count-bounds",
    "section": "maintenance",
    "rule": "Jedes Agent-Dokument muss zwischen 5 und 9 Regeln enthalten — bei weniger die Abdeckung erweitern, bei mehr den Agenten aufteilen.",
    "rationale": "Zu wenige Regeln bedeuten Lücken; zu viele deuten auf zu breite Zuständigkeit und Grenzwertkonflikte hin.",
    "severity": "must",
    "source": "agent:AGENT_QUALITY_AGENT"
  },
  {
    "id": "quality-bad-good-example",
    "section": "maintenance",
    "rule": "Jede Regel muss einen 'Bad → Good'-Codeblock mit Beispielen für Verstoß und Korrektur enthalten.",
    "rationale": "Regeln ohne Beispiele werden unterschiedlich interpretiert und ermöglichen Entwicklern keine Selbstkontrolle.",
    "severity": "must",
    "source": "agent:AGENT_QUALITY_AGENT"
  },
  {
    "id": "quality-no-boundary-conflicts",
    "section": "maintenance",
    "rule": "Im related-Abschnitt jeden überlappenden Agenten mit einer expliziten Boundary-Aussage auflisten, die klärt, welcher Agent die Entscheidungshoheit hat.",
    "rationale": "Überlappende Zuständigkeiten ohne Klärung führen zu widersprüchlicher Guidance und Verwirrung bei Entwicklern.",
    "severity": "must",
    "source": "agent:AGENT_QUALITY_AGENT"
  },
  {
    "id": "quality-named-enforcement-tool",
    "section": "maintenance",
    "rule": "Das 'Enforced by'-Feld jeder Regel muss ein spezifisches Tool (z.B. ESLint-Regel, tsc, review-agents.ts) mit Level und Coverage nennen — generische Angaben wie 'CI pipeline' sind unzulässig.",
    "rationale": "Vage Enforcement-Angaben erzeugen falsches Vertrauen; nur spezifische Tool-Namen lassen sich im Audit verifizieren.",
    "severity": "must",
    "source": "agent:AGENT_QUALITY_AGENT"
  },
  {
    "id": "quality-version-and-date",
    "section": "maintenance",
    "rule": "Das YAML-Frontmatter jedes Agent-Dokuments muss version (Semver) und last_updated (ISO-Datum) enthalten und bei Regeländerungen die Minor-Version erhöhen.",
    "rationale": "Ohne Versionierung lässt sich nicht feststellen, ob ein Agent den aktuellen Engineering-Standard widerspiegelt oder veraltet ist.",
    "severity": "should",
    "source": "agent:AGENT_QUALITY_AGENT"
  },
  {
    "id": "quality-checklist-matches-rules",
    "section": "maintenance",
    "rule": "Der Checklist-Abschnitt muss exakt eine Checkbox pro Regel in derselben Reihenfolge enthalten — beim Hinzufügen oder Entfernen von Regeln die Checklist sofort anpassen.",
    "rationale": "Eine nicht übereinstimmende Checklist führt dazu, dass Regeln bei manuellen Reviews übersprungen oder fälschlich geprüft werden.",
    "severity": "should",
    "source": "agent:AGENT_QUALITY_AGENT"
  },
  {
    "id": "ai-act-risk-classification-doc",
    "section": "maintenance",
    "rule": "Erstelle docs/ai-act-risk-classification.md mit der Risikoklasse des KI-Systems (minimal-risk, limited-risk, high-risk oder unacceptable) gemäß EU AI Act Art. 6.",
    "rationale": "Undokumentierte Risikoklassifikation macht Compliance-Nachweise unmöglich; bei High-Risk-Systemen drohen Bußgelder bis 35 Mio. € oder 7 % des Jahresumsatzes.",
    "severity": "must",
    "source": "agent:AI_ACT_AGENT"
  },
  {
    "id": "ai-act-interaction-disclosure",
    "section": "code-rules",
    "rule": "Informiere Nutzer sichtbar und verständlich darüber, dass sie mit einem KI-System interagieren, bevor die Interaktion beginnt (EU AI Act Art. 50 Abs. 1).",
    "rationale": "Fehlende KI-Disclosure ist eine direkte Art.-50-Verletzung mit unmittelbarer Durchsetzung.",
    "severity": "must",
    "source": "agent:AI_ACT_AGENT"
  },
  {
    "id": "ai-act-generated-content-marking",
    "section": "code-rules",
    "rule": "Kennzeichne KI-generierte Texte, Bilder und Inhalte mit aria-label, CSS-Klasse oder data-Attribut (z. B. data-ai-content, ai-generated) gemäß EU AI Act Art. 50 Abs. 2.",
    "rationale": "Nutzer haben das Recht zu wissen, wenn Inhalte maschinell erzeugt wurden, insbesondere bei Entscheidungsgrundlagen.",
    "severity": "must",
    "source": "agent:AI_ACT_AGENT"
  },
  {
    "id": "ai-act-decision-logging",
    "section": "db",
    "rule": "Logge alle KI-Modellaufrufe mit Zeitstempel, Nutzerkontext sowie Ein- und Ausgabe in einer revisionssicheren Datenbanktabelle (EU AI Act Art. 12).",
    "rationale": "Pflichtnachweis für Audit-Trails bei High-Risk-KI-Systemen; fehlende Logs verhindern behördliche Prüfungen.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:AI_ACT_AGENT"
  },
  {
    "id": "ai-act-human-oversight",
    "section": "code-rules",
    "rule": "Implementiere eine Feedback- oder Korrekturmöglichkeit (z. B. Daumen hoch/runter, Override, Human-Review-Trigger) für jede KI-gestützte Ausgabe (EU AI Act Art. 14).",
    "rationale": "Nutzer müssen KI-Entscheidungen anfechten oder korrigieren können.",
    "severity": "must",
    "source": "agent:AI_ACT_AGENT"
  },
  {
    "id": "ai-act-intended-use-doc",
    "section": "maintenance",
    "rule": "Erstelle docs/ai-intended-use.md mit Zweck, Einschränkungen und Deployment-Kontext des KI-Systems gemäß EU AI Act Art. 13 Abs. 1.",
    "rationale": "Technische Dokumentation des Verwendungszwecks ist Pflichtbestandteil der Konformitätsbewertung.",
    "severity": "must",
    "source": "agent:AI_ACT_AGENT"
  },
  {
    "id": "ai-act-prohibited-practices",
    "section": "security",
    "rule": "Schließe verbotene KI-Praktiken aus dem Code aus: subliminale Manipulation, Social Scoring, biometrische Massenüberwachung und Emotionserkennung am Arbeitsplatz (EU AI Act Art. 5).",
    "rationale": "Verbotene KI-Praktiken unterliegen den höchsten Bußgeldern und sofortigen Durchsetzungsmaßnahmen.",
    "severity": "must",
    "source": "agent:AI_ACT_AGENT"
  },
  {
    "id": "ai-act-system-testing-doc",
    "section": "testing",
    "rule": "Dokumentiere KI-Modell-Tests, Validierungsmetriken und Performance-Benchmarks in docs/ai-testing.md gemäß EU AI Act Art. 9 (Risikomanagement).",
    "rationale": "Systematische Tests sind für Risikomitigation und regulatorische Compliance nachweispflichtig.",
    "severity": "should",
    "source": "agent:AI_ACT_AGENT"
  },
  {
    "id": "ai-no-user-input-in-system-prompt",
    "section": "security",
    "rule": "User-Input niemals direkt in System-Prompts interpolieren — stets als separate Nachricht mit Rolle 'user' übergeben.",
    "rationale": "Direkte Interpolation ermöglicht Prompt-Injection-Angriffe, die Safety-Instructions überschreiben und das KI-System kompromittieren können.",
    "severity": "must",
    "source": "agent:AI_INTEGRATION_AGENT"
  },
  {
    "id": "ai-validate-output-with-schema",
    "section": "error-handling",
    "rule": "Alle KI-Ausgaben vor der Weiterverarbeitung mit einem Zod-Schema validieren — rohe AI-Responses nie direkt speichern oder rendern.",
    "rationale": "KI-Outputs sind unzuverlässig und können ungültige Formate oder Schadinhalt enthalten, die Downstream-Systeme beschädigen.",
    "severity": "must",
    "source": "agent:AI_INTEGRATION_AGENT"
  },
  {
    "id": "ai-use-provider-abstraction",
    "section": "structure",
    "rule": "Provider-SDKs ausschließlich hinter einer IAIProvider-Abstraktionsschicht kapseln — direkte SDK-Imports außerhalb des Provider-Verzeichnisses verbieten.",
    "rationale": "Direktes Provider-Coupling erzeugt Vendor-Lock-in, erschwert Tests und macht Provider-Wechsel teuer.",
    "severity": "must",
    "source": "agent:AI_INTEGRATION_AGENT"
  },
  {
    "id": "ai-configure-token-limits",
    "section": "code-rules",
    "rule": "Bei jedem KI-Aufruf explizit maxOutputTokens und maxContextTokens konfigurieren — keine Aufrufe ohne Token-Limits.",
    "rationale": "Fehlende Token-Limits führen zu unkontrollierbaren API-Kosten und unvorhersehbarem Verhalten bei Kontextfenster-Überschreitungen.",
    "severity": "must",
    "source": "agent:AI_INTEGRATION_AGENT"
  },
  {
    "id": "ai-implement-fallback-strategy",
    "section": "error-handling",
    "rule": "Jeden KI-Service-Aufruf mit einer Fallback-Strategie (alternativer Provider, Circuit-Breaker oder gecachte Antwort) absichern.",
    "rationale": "KI-Dienste sind unzuverlässig; ohne Fallback werden KI-Features zu Single Points of Failure.",
    "severity": "must",
    "source": "agent:AI_INTEGRATION_AGENT"
  },
  {
    "id": "ai-deterministic-structured-output",
    "section": "code-rules",
    "rule": "Für KI-Aufrufe mit strukturierten Ausgaben (JSON, XML) temperature: 0 und — wenn verfügbar — einen festen Seed setzen.",
    "rationale": "Nicht-deterministische Ausgaben machen strukturierte AI-Responses unzuverlässig und führen zu Parsing-Fehlern in der Produktion.",
    "severity": "must",
    "source": "agent:AI_INTEGRATION_AGENT"
  },
  {
    "id": "ai-cache-expensive-calls",
    "section": "maintenance",
    "rule": "Teure oder häufig wiederholte KI-Aufrufe mit einem Cache (z. B. Redis, normalisierte Prompt-Keys, dokumentierter TTL) absichern.",
    "rationale": "Unkontrollierte wiederholte AI-API-Aufrufe verursachen unnötige Kosten und verschlechtern die Antwortzeiten.",
    "severity": "should",
    "source": "agent:AI_INTEGRATION_AGENT"
  },
  {
    "id": "analytics-no-pii-events",
    "section": "security",
    "rule": "Keine PII (E-Mails, Namen, rohe User-IDs) in Analytics-Events senden — pseudonymisierte Identifier verwenden.",
    "rationale": "PII in Analytics-Plattformen verstößt gegen GDPR/CCPA, riskiert hohe Bußgelder und untergräbt das Nutzervertrauen.",
    "severity": "must",
    "source": "agent:ANALYTICS_AGENT"
  },
  {
    "id": "analytics-require-consent",
    "section": "security",
    "rule": "Jeden analytics.track()-Aufruf hinter eine consent.hasConsent('analytics')-Prüfung kapseln.",
    "rationale": "Tracking ohne explizite Einwilligung verstößt gegen GDPR/CCPA und kann Bußgelder von bis zu 4 % des weltweiten Umsatzes nach sich ziehen.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:ANALYTICS_AGENT"
  },
  {
    "id": "analytics-session-recording-consent",
    "section": "security",
    "rule": "Session-Recording-Tools (Hotjar, LogRocket) nur nach separater consent.hasConsent('session_recording')-Prüfung starten — allgemeine Analytics-Einwilligung reicht nicht aus.",
    "rationale": "Session Recordings erfassen besonders invasive Nutzerinteraktionen und erfordern eine eigenständige Opt-in-Kategorie.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:ANALYTICS_AGENT"
  },
  {
    "id": "analytics-separate-from-observability",
    "section": "structure",
    "rule": "User-Analytics-Events strikt von System-Observability (Logging, Metriken, Tracing) trennen — keine gemeinsamen Calls oder gegenseitigen Importe.",
    "rationale": "Vermischung macht Consent-Management unmöglich und kontaminiert beide Datenströme für Debugging und Compliance.",
    "severity": "must",
    "source": "agent:ANALYTICS_AGENT"
  },
  {
    "id": "analytics-versioned-schemas",
    "section": "structure",
    "rule": "Event-Schemas versionieren, validieren und ein schemaVersion-Feld in jedem Payload mitführen.",
    "rationale": "Unversionierte Schemas brechen Dashboards bei Änderungen und korrumpieren historische Daten.",
    "severity": "must",
    "source": "agent:ANALYTICS_AGENT"
  },
  {
    "id": "analytics-pseudonymize-identifiers",
    "section": "security",
    "rule": "Nutzer-Identifier in Events ausschließlich über einen zentralen Pseudonymisierungsdienst (z. B. identity.getAnonymousId()) ableiten — rohe Datenbank-IDs oder E-Mails sind verboten.",
    "rationale": "Direkte IDs ermöglichen Re-Identifizierung und machen GDPR-Recht-auf-Vergessenwerden-Compliance unmöglich.",
    "appliesWhen": [
      "auth:true"
    ],
    "severity": "must",
    "source": "agent:ANALYTICS_AGENT"
  },
  {
    "id": "analytics-document-event-schemas",
    "section": "maintenance",
    "rule": "Neue Analytics-Events mit Zweck, Schema-Version und Business-Kontext in einem zentralen Event-Katalog (z. B. analytics_events.md) dokumentieren.",
    "rationale": "Undokumentierte Events führen zu Duplikaten, inkonsistentem Tracking und technischen Schulden.",
    "severity": "should",
    "source": "agent:ANALYTICS_AGENT"
  },
  {
    "id": "api-version-public-routes",
    "section": "structure",
    "rule": "Öffentliche API-Routen mit externen Konsumenten unter /api/v[N]/ versionieren.",
    "rationale": "Öffentliche APIs sind Verträge mit externen Nutzern — Breaking Changes ohne Versionierung zerstören Integrationen. Interne APIs benötigen keine Versionierung.",
    "severity": "should",
    "source": "agent:API_AGENT"
  },
  {
    "id": "api-consistent-error-structure",
    "section": "error-handling",
    "rule": "Fehlerantworten einheitlich als { error: { message, code } } strukturieren und per Typ erzwingen.",
    "rationale": "Inkonsistente Fehlerformate brechen Client-Fehlerbehandlung und erschweren das Debugging über Endpunkte hinweg.",
    "severity": "must",
    "source": "agent:API_AGENT"
  },
  {
    "id": "api-validate-webhook-signatures",
    "section": "security",
    "rule": "Webhook-Handler müssen HMAC/Signatur validieren, bevor der Request-Body verarbeitet wird.",
    "rationale": "Unvalidierte Webhooks erlauben Angreifern, beliebige Aktionen durch gefälschte Requests auszulösen.",
    "severity": "must",
    "source": "agent:API_AGENT"
  },
  {
    "id": "api-resilience-patterns",
    "section": "code-rules",
    "rule": "Externe HTTP-Aufrufe mit Timeout (≤5 s), Retry mit exponentiellem Backoff und Circuit Breaker absichern.",
    "rationale": "Aufrufe ohne Timeout und Retry erzeugen kaskadierende Ausfälle bei Netzwerkproblemen oder hoher Last.",
    "severity": "must",
    "source": "agent:API_AGENT"
  },
  {
    "id": "api-vendor-abstraction",
    "section": "structure",
    "rule": "Externe Vendor-SDKs ausschließlich hinter einem Interface-Adapter kapseln — nie direkt im Business-Code importieren.",
    "rationale": "Direktes Vendor-Coupling macht Provider-Wechsel aufwendig und erzeugt Lock-in.",
    "severity": "must",
    "source": "agent:API_AGENT"
  },
  {
    "id": "api-openapi-docs-required",
    "section": "maintenance",
    "rule": "Jeden neuen öffentlichen Endpunkt mit einer OpenAPI/Swagger-Spezifikation dokumentieren.",
    "rationale": "Undokumentierte APIs erzeugen Integrations-Reibung und machen Breaking Changes erst in Produktion sichtbar.",
    "severity": "must",
    "source": "agent:API_AGENT"
  },
  {
    "id": "api-semantic-http",
    "section": "code-rules",
    "rule": "HTTP-Verben und Status-Codes nach REST-Semantik verwenden (GET=lesen, POST=201, DELETE statt GET /delete).",
    "rationale": "Fehlverwendete HTTP-Verben brechen Caching, verwirren Clients und verletzen REST-Prinzipien.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "should",
    "source": "agent:API_AGENT"
  },
  {
    "id": "api-validate-io-contracts",
    "section": "security",
    "rule": "Alle API-Eingaben und -Ausgaben gegen feste Schemata validieren (z.B. Zod, DTOs).",
    "rationale": "Fehlende Validierung schafft Sicherheitslücken und legt interne Datenstrukturen unbeabsichtigt offen.",
    "severity": "should",
    "source": "agent:API_AGENT"
  },
  {
    "id": "structure-dependency-model",
    "section": "structure",
    "rule": "Ein explizites, dokumentiertes Abhängigkeitsmodell mit erlaubten Import-Richtungen definieren und per Tooling (z. B. dependency-cruiser oder eslint-plugin-boundaries) erzwingen — keine zirkulären Abhängigkeiten.",
    "rationale": "Ohne explizites Modell entstehen zirkuläre Abhängigkeiten und unkontrollierte Kopplung; Änderungen brechen unverwandte Bereiche.",
    "severity": "must",
    "source": "agent:ARCHITECTURE_AGENT_v3"
  },
  {
    "id": "security-no-server-code-in-client",
    "section": "security",
    "rule": "Server-only-Code niemals in Client-Bundles importieren und Client-only-Code niemals serverseitig ausführen — geteilten Code in einem dedizierten Shared-Verzeichnis ablegen.",
    "rationale": "Server-Code in Client-Bundles leakt Secrets und interne Logik; Client-Code auf dem Server führt zu Runtime-Crashes.",
    "appliesWhen": [
      "platform:web",
      "stack:next",
      "stack:nuxt",
      "stack:svelte",
      "stack:remix"
    ],
    "severity": "must",
    "source": "agent:ARCHITECTURE_AGENT_v3"
  },
  {
    "id": "structure-no-new-namespaces",
    "section": "structure",
    "rule": "Neue strukturelle Namespaces (Top-Level-Verzeichnisse, Packages, Architektur-Zonen) nur nach expliziter Freigabe anlegen.",
    "rationale": "KI-Tools erstellen opportunistisch neue Ordner; jeder ungeplante Namespace erodiert die Gesamtstruktur.",
    "severity": "must",
    "source": "agent:ARCHITECTURE_AGENT_v3"
  },
  {
    "id": "structure-defined-file-locations",
    "section": "structure",
    "rule": "Jede Datei an einem klar definierten Ort ablegen — generische Ordner wie helpers/, misc/, temp/ oder utils/ ohne klaren Scope sind verboten.",
    "rationale": "Ohne klare Platzierungsregeln landet gleicher Code-Typ an mehreren verschiedenen Orten.",
    "severity": "should",
    "source": "agent:ARCHITECTURE_AGENT_v3"
  },
  {
    "id": "structure-colocate-by-feature",
    "section": "structure",
    "rule": "Feature-spezifischen Code (Komponenten, Logik, Typen, Tests) in einem Feature-Verzeichnis mit explizitem Index als Public API bündeln — keine direkten Cross-Feature-Imports.",
    "rationale": "Co-lokierter Code ist leichter zu verstehen, testen und löschen als über viele Verzeichnisse verteilter Code.",
    "severity": "should",
    "source": "agent:ARCHITECTURE_AGENT_v3"
  },
  {
    "id": "structure-shared-code-justification",
    "section": "structure",
    "rule": "Code erst in die Shared-Schicht verschieben, wenn er von mindestens zwei Konsumenten genutzt wird — keine präventive Abstraktion, zuerst duplizieren.",
    "rationale": "Voreilig erstellte Shared-Utilities erzeugen tote Abstraktionen und unerwünschte Kopplung.",
    "severity": "should",
    "source": "agent:ARCHITECTURE_AGENT_v3"
  },
  {
    "id": "structure-enforce-file-size-limits",
    "section": "structure",
    "rule": "Definierte Schwellenwerte für die Dateigröße per Linting und CI durchsetzen und bei Überschreitung refaktorieren.",
    "rationale": "Große Dateien sind ein Frühindikator für erodierende Modularität.",
    "severity": "should",
    "source": "agent:ARCHITECTURE_AGENT_v3"
  },
  {
    "id": "maintenance-document-architecture-decisions",
    "section": "maintenance",
    "rule": "Signifikante Architekturentscheidungen als ADR in docs/adr/ dokumentieren — mit Was, Warum, Alternativen und Konsequenzen.",
    "rationale": "In KI-unterstützten Projekten werden Entscheidungen schnell getroffen und vergessen; ADRs bewahren das Wissen.",
    "severity": "must",
    "source": "agent:ARCHITECTURE_AGENT_v3"
  },
  {
    "id": "backup-3-2-1-rule",
    "section": "maintenance",
    "rule": "Halte die 3-2-1-Backup-Regel ein: 3 Kopien auf 2 verschiedenen Medientypen, davon 1 off-site.",
    "rationale": "Schützt gegen gleichzeitige Ausfälle von Speichermedien, Standorten und regionalen Katastrophen.",
    "severity": "must",
    "source": "agent:BACKUP_DR_AGENT"
  },
  {
    "id": "pitr-config",
    "section": "db",
    "rule": "Aktiviere Point-in-Time Recovery (PITR) mit mindestens 7 Tagen Aufbewahrung für alle Produktionsdatenbanken.",
    "rationale": "Ohne PITR sind nur Snapshot-Wiederherstellungen möglich, was potenziell stundenlangen Datenverlust bedeutet.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:BACKUP_DR_AGENT"
  },
  {
    "id": "define-recovery-objectives",
    "section": "maintenance",
    "rule": "Definiere und dokumentiere RTO und RPO je Service mit Stakeholder-Freigabe im DR-Runbook.",
    "rationale": "Ohne definierte Recovery-Ziele lassen sich keine angemessenen Backup-Strategien oder Kosten-Verfügbarkeits-Abwägungen festlegen.",
    "severity": "must",
    "source": "agent:BACKUP_DR_AGENT"
  },
  {
    "id": "quarterly-restore-test",
    "section": "testing",
    "rule": "Führe quartalsweise automatisierte Restore-Tests durch und dokumentiere die Ergebnisse.",
    "rationale": "Ungetestete Backups sind keine Backups — regelmäßige Tests decken Korruption, Konfigurationsdrift und Verfahrenslücken auf, bevor ein Desaster eintritt.",
    "severity": "must",
    "source": "agent:BACKUP_DR_AGENT"
  },
  {
    "id": "cross-region-replication",
    "section": "maintenance",
    "rule": "Konfiguriere Cross-Region-Replikation für alle produktiven Speicher mit mindestens einer sekundären Region.",
    "rationale": "Einzelne Regionen sind anfällig für regionale Ausfälle, Netzwerkpartitionen und anbieterspezifische Störungen.",
    "severity": "must",
    "source": "agent:BACKUP_DR_AGENT"
  },
  {
    "id": "dr-runbook-currency",
    "section": "maintenance",
    "rule": "Halte DR-Runbooks unter Versionskontrolle und überprüfe sie mindestens alle 90 Tage mit datiertem Testvermerk.",
    "rationale": "Veraltete Runbooks führen bei Hochstress-Incidents zu Fehlentscheidungen und können Ausfälle verschlimmern.",
    "severity": "must",
    "source": "agent:BACKUP_DR_AGENT"
  },
  {
    "id": "incident-classification",
    "section": "error-handling",
    "rule": "Definiere ein Incident-Klassifizierungsschema (P0–P3) mit klaren Eskalations-Triggern in der Incident-Response-Dokumentation.",
    "rationale": "Konsistente Klassifizierung ermöglicht angemessene Ressourcenzuweisung und Kommunikation während Störungen.",
    "severity": "should",
    "source": "agent:BACKUP_DR_AGENT"
  },
  {
    "id": "bfsg-accessibility-statement",
    "section": "structure",
    "rule": "Erstelle eine dedizierte Barrierefreiheitserklärung unter /barrierefreiheit oder /accessibility-statement mit BFSG-Konformitätsdetails.",
    "rationale": "Rechtspflicht gemäß BFSG §12 — fehlende Erklärung kann zu Bußgeldern und Marktzugangssperren führen.",
    "appliesWhen": [
      "platform:web",
      "commerce:true"
    ],
    "severity": "must",
    "source": "agent:BFSG_AGENT"
  },
  {
    "id": "bfsg-feedback-mechanism",
    "section": "structure",
    "rule": "Binde in der Barrierefreiheitserklärung einen E-Mail-Kontakt oder ein Kontaktformular für Barrierefreiheits-Feedback ein.",
    "rationale": "BFSG §12 Abs. 3 schreibt einen Feedback-Mechanismus für Nutzer vor.",
    "appliesWhen": [
      "platform:web",
      "commerce:true"
    ],
    "severity": "must",
    "source": "agent:BFSG_AGENT"
  },
  {
    "id": "bfsg-applicability-documented",
    "section": "maintenance",
    "rule": "Dokumentiere im README oder in package.json, warum das BFSG auf das Produkt anwendbar ist (B2C, öffentlicher Zugang, Dienstleistungsart).",
    "rationale": "Klare Anwendbarkeitsbewertung ist für regulatorische Compliance und Audit-Verteidigung erforderlich.",
    "appliesWhen": [
      "platform:web",
      "commerce:true"
    ],
    "severity": "should",
    "source": "agent:BFSG_AGENT"
  },
  {
    "id": "bfsg-document-language",
    "section": "code-rules",
    "rule": "Setze das lang-Attribut am <html>-Element oder im Root-Layout.",
    "rationale": "Ohne Sprachdeklaration können Screenreader Text nicht korrekt vorlesen — WCAG 2.1 SC 3.1.1.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:BFSG_AGENT"
  },
  {
    "id": "bfsg-skip-navigation",
    "section": "code-rules",
    "rule": "Implementiere als erstes fokussierbares Element auf jeder Seite einen Skip-to-main-content-Link.",
    "rationale": "Tastaturnutzer müssen repetitive Navigation überspringen können — WCAG 2.1 SC 2.4.1 Level A.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:BFSG_AGENT"
  },
  {
    "id": "bfsg-touch-target-size",
    "section": "code-rules",
    "rule": "Dimensioniere interaktive Elemente auf mindestens 44×44 px.",
    "rationale": "Zu kleine Ziele diskriminieren Nutzer mit motorischen Einschränkungen — WCAG 2.1 SC 2.5.5 AA.",
    "appliesWhen": [
      "platform:web",
      "platform:native"
    ],
    "severity": "must",
    "source": "agent:BFSG_AGENT"
  },
  {
    "id": "bfsg-reduced-motion",
    "section": "code-rules",
    "rule": "Reduziere oder deaktiviere alle Animationen und Übergänge bei prefers-reduced-motion.",
    "rationale": "Nutzer mit vestibulären Störungen können durch Bewegung Schwindel erleiden — WCAG 2.1 SC 2.3.3.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:BFSG_AGENT"
  },
  {
    "id": "bfsg-automated-a11y-testing",
    "section": "testing",
    "rule": "Integriere axe-core (z.B. @axe-core/react, axe-playwright oder jest-axe) in die CI/CD-Pipeline und führe es bei jedem Build aus.",
    "rationale": "Die BFSG-Konformitätserklärung erfordert Testnachweise — automatisierte Tests liefern den Audit-Trail.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:BFSG_AGENT"
  },
  {
    "id": "code-strict-equality",
    "section": "code-rules",
    "rule": "Immer strikte Gleichheitsoperatoren (=== und !==) statt == und != verwenden.",
    "rationale": "Loose equality führt durch implizite Typumwandlung zu unerwartetem Verhalten und schwer findbaren Bugs.",
    "severity": "must",
    "source": "agent:CODE_STYLE_AGENT"
  },
  {
    "id": "code-prefer-const",
    "section": "code-rules",
    "rule": "Variablen standardmäßig mit const deklarieren; let nur bei notwendiger Neuzuweisung verwenden.",
    "rationale": "const verhindert versehentliche Neuzuweisung und signalisiert Unveränderlichkeit.",
    "severity": "must",
    "source": "agent:CODE_STYLE_AGENT"
  },
  {
    "id": "code-max-line-length",
    "section": "code-rules",
    "rule": "Zeilen auf maximal 100 Zeichen begrenzen (Kommentare und Strings ausgenommen) und lange Ausdrücke sinnvoll umbrechen.",
    "rationale": "Zu lange Zeilen erschweren Code-Reviews und erhöhen das Risiko, Details zu übersehen.",
    "severity": "must",
    "source": "agent:CODE_STYLE_AGENT"
  },
  {
    "id": "code-explicit-return-types",
    "section": "code-rules",
    "rule": "Exportierte Funktionen mit explizitem Rückgabetyp annotieren; interne Hilfsfunktionen dürfen inferieren.",
    "rationale": "Explizite Rückgabetypen dienen als Dokumentation und verhindern unbeabsichtigte API-Änderungen.",
    "appliesWhen": [
      "stack:node",
      "stack:react",
      "stack:next"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE_AGENT"
  },
  {
    "id": "code-complexity-limits",
    "section": "code-rules",
    "rule": "Funktionsgröße auf ~30 Zeilen und Verschachtelungstiefe auf maximal 4 Ebenen begrenzen.",
    "rationale": "Große, tief verschachtelte Funktionen sind schwer zu testen und zu verstehen.",
    "severity": "should",
    "source": "agent:CODE_STYLE_AGENT"
  },
  {
    "id": "code-jsdoc-complex",
    "section": "code-rules",
    "rule": "Funktionen mit zyklomatischer Komplexität > 8 oder fachlicher Business-Logik mit JSDoc dokumentieren (Parameter, Rückgabewert, Business Rules).",
    "rationale": "Komplexe Logik ohne Dokumentation wird unwartbar, wenn Anforderungen oder Teammitglieder wechseln.",
    "severity": "should",
    "source": "agent:CODE_STYLE_AGENT"
  },
  {
    "id": "typescript-enable-strict-mode",
    "section": "structure",
    "rule": "Strict Mode in tsconfig.json mit strict: true aktivieren und 'any' ohne Begründung vermeiden.",
    "rationale": "Strict Mode fängt typbezogene Fehler früh ab und erhöht die Typsicherheit.",
    "appliesWhen": [
      "stack:node",
      "stack:react",
      "stack:next"
    ],
    "severity": "must",
    "source": "agent:CODE_STYLE_AGENT"
  },
  {
    "id": "no-empty-catch-blocks",
    "section": "error-handling",
    "rule": "Leere Catch-Blöcke vermeiden und Fehler gezielt loggen oder behandeln.",
    "rationale": "Verhindert die stille Unterdrückung von Fehlern.",
    "severity": "must",
    "source": "agent:CODE_STYLE_AGENT"
  },
  {
    "id": "i18n-externalize-strings",
    "section": "code-rules",
    "rule": "Alle nutzersichtbaren Texte über ein dediziertes i18n-Framework (z.B. react-i18next) und t()-Aufrufe externalisieren — keine Hardcoded-Strings in Komponenten oder Fehlermeldungen.",
    "rationale": "Hardcoded Strings verhindern Internationalisierung und erzeugen inkonsistentes Microcopy; ein Framework sichert korrekte Übersetzungs-Workflows.",
    "appliesWhen": [
      "platform:web",
      "platform:native"
    ],
    "severity": "must",
    "source": "agent:CONTENT_AGENT"
  },
  {
    "id": "i18n-framework-required",
    "section": "structure",
    "rule": "Ein dediziertes i18n-Framework im App-Root konfigurieren und für alle Übersetzungen verwenden — keine ad-hoc Locale-Maps.",
    "rationale": "Ohne i18n-Framework bricht der Übersetzungsworkflow zusammen und Textverwaltung wird unkontrollierbar.",
    "severity": "must",
    "source": "agent:CONTENT_AGENT"
  },
  {
    "id": "i18n-locale-aware-formatting",
    "section": "code-rules",
    "rule": "Datum-, Zahlen- und Währungsformatierungen ausschließlich über Intl.NumberFormat, Intl.DateTimeFormat oder i18n-Formatierer ausgeben — nie manuell konkatenieren.",
    "rationale": "Hardcoded Formate brechen Nutzererwartungen in anderen Locales und Währungsräumen.",
    "severity": "must",
    "source": "agent:CONTENT_AGENT"
  },
  {
    "id": "i18n-rtl-logical-css",
    "section": "code-rules",
    "rule": "Logische CSS-Eigenschaften (margin-inline-start, float: inline-start) statt direktionaler Eigenschaften (margin-left) verwenden, um RTL-Layouts zu unterstützen.",
    "rationale": "Hardcoded Richtungs-CSS bricht das Layout für arabische und hebräische Nutzer.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "should",
    "source": "agent:CONTENT_AGENT"
  },
  {
    "id": "i18n-hierarchical-translation-keys",
    "section": "naming",
    "rule": "Übersetzungsschlüssel hierarchisch nach dem Muster feature.component.action benennen (z.B. buttons.save.loading) — keine flachen Schlüsselstrukturen.",
    "rationale": "Flache Schlüssel werden unwartbar; hierarchische Strukturen ermöglichen Bulk-Operationen und kontextbewusste Übersetzungen.",
    "severity": "must",
    "source": "agent:CONTENT_AGENT"
  },
  {
    "id": "i18n-actionable-error-messages",
    "section": "error-handling",
    "rule": "Fehlermeldungen müssen beschreiben, was schiefgelaufen ist, warum es passiert ist und was der Nutzer als Nächstes tun soll — keine generischen Texte wie 'Invalid input'.",
    "rationale": "Vage Fehler frustrieren Nutzer und erhöhen das Support-Aufkommen; actionable Meldungen ermöglichen Self-Service.",
    "severity": "should",
    "source": "agent:CONTENT_AGENT"
  },
  {
    "id": "i18n-consistent-microcopy",
    "section": "maintenance",
    "rule": "Gleichartige UI-Aktionen mit konsistenter Terminologie und Tonalität benennen — ein Glossary für Standardbegriffe pflegen und abweichende Formulierungen im Review ablehnen.",
    "rationale": "Inkonsistente Terminologie verwirrt Nutzer und mindert die Produktqualität.",
    "severity": "should",
    "source": "agent:CONTENT_AGENT"
  },
  {
    "id": "security-no-system-details-in-errors",
    "section": "security",
    "rule": "Interne Systemdetails, Stack Traces, Hostnamen oder SQL-Fehlermeldungen niemals in nutzersichtbaren Fehlertexten weitergeben.",
    "rationale": "Fehlermeldungen können Systemarchitektur oder sensitive Daten an Angreifer leaken.",
    "severity": "must",
    "source": "agent:CONTENT_AGENT"
  },
  {
    "id": "cost-configure-budget-alerts",
    "section": "maintenance",
    "rule": "Budget-Alerts für Cloud- und LLM-Dienste mit Schwellenwerten bei 50%, 80% und 100% des Limits konfigurieren.",
    "rationale": "Ohne automatisierte Alerts können unvorhersehbar skalierende KI-Workloads Budgets in Stunden aufbrauchen, bevor jemand eingreift.",
    "severity": "must",
    "source": "agent:COST_AWARENESS_AGENT"
  },
  {
    "id": "cost-enforce-token-budgets",
    "section": "code-rules",
    "rule": "Token-Budgets pro Nutzer/Org serverseitig durchsetzen und LLM-Anfragen bei erschöpftem Kontingent ablehnen.",
    "rationale": "Unkontrollierter Token-Verbrauch erschöpft Budgets innerhalb von Stunden und führt zu Service-Degradation.",
    "severity": "must",
    "source": "agent:COST_AWARENESS_AGENT"
  },
  {
    "id": "cost-rate-limit-llm-endpoints",
    "section": "security",
    "rule": "Alle LLM- und KI-Endpunkte mit per-User- und globalem Rate-Limit absichern.",
    "rationale": "Ungeschützte Endpunkte können missbraucht werden, um Quotas zu erschöpfen und massive Kostenspitzen auszulösen.",
    "severity": "must",
    "source": "agent:COST_AWARENESS_AGENT"
  },
  {
    "id": "cost-check-licenses",
    "section": "maintenance",
    "rule": "Abhängigkeiten vor dem Merge mit einem License-Scanner auf GPL/AGPL-Konflikte mit kommerzieller Nutzung prüfen.",
    "rationale": "Lizenzverstöße können teure Rechtsstreitigkeiten, erzwungenes Open-Sourcing oder Notfall-Dependency-Wechsel auslösen.",
    "severity": "must",
    "source": "agent:COST_AWARENESS_AGENT"
  },
  {
    "id": "cost-tag-cloud-resources",
    "section": "structure",
    "rule": "Alle Cloud-Ressourcen mit den Tags cost-center, feature, environment und owner versehen.",
    "rationale": "Ohne Kostenzuordnung können Teams Ausgaben nicht optimieren oder Kosten den richtigen Business-Units zuordnen.",
    "severity": "must",
    "source": "agent:COST_AWARENESS_AGENT"
  },
  {
    "id": "cost-document-vendor-risks",
    "section": "maintenance",
    "rule": "Vendor-spezifische Features, Datenportabilität und Migrationsaufwand in docs/vendor-analysis.md dokumentieren.",
    "rationale": "Versteckte Vendor-Abhängigkeiten schaffen teure Migrationsbarrieren und schwächen die Verhandlungsposition bei Vertragsverlängerungen.",
    "severity": "should",
    "source": "agent:COST_AWARENESS_AGENT"
  },
  {
    "id": "cost-document-exit-strategies",
    "section": "maintenance",
    "rule": "Für jeden kritischen Vendor eine Exit-Strategie mit Migrationsschritten, Daten-Export und Zeitschätzung unter docs/exit-strategies/ dokumentieren.",
    "rationale": "Ohne dokumentierte Exit-Strategie werden Vendor-Beziehungen zu permanenten Abhängigkeiten, die Preiserhöhungen begünstigen.",
    "severity": "should",
    "source": "agent:COST_AWARENESS_AGENT"
  },
  {
    "id": "db-migrations-reversible",
    "section": "db",
    "rule": "Migrationen sequenziell versionieren und für jede eine umkehrbare Down-Migration bereitstellen.",
    "rationale": "Unversionierte oder nicht umkehrbare Migrationen machen Deployment-Rollbacks unmöglich und den Datenbankzustand über Umgebungen hinweg unvorhersehbar.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:DATABASE_AGENT"
  },
  {
    "id": "db-rls-all-tables",
    "section": "security",
    "rule": "Row Level Security für jede Tabelle mit nutzerbezogenen Daten aktivieren und explizite Policies definieren, bevor die Tabelle produktiv genutzt wird.",
    "rationale": "Tabellen ohne RLS-Policies exponieren alle Zeilen für alle authentifizierten Nutzer und verletzen Datenzugriffsgrenzen.",
    "appliesWhen": [
      "db:true",
      "auth:true"
    ],
    "severity": "must",
    "source": "agent:DATABASE_AGENT"
  },
  {
    "id": "db-no-service-role-frontend",
    "section": "security",
    "rule": "Den BaaS-Service-Role-Key ausschließlich serverseitig verwenden und niemals in Frontend-Bundles oder Client-Code einbetten.",
    "rationale": "Ein Service-Role-Key im Frontend umgeht alle RLS-Policies und gewährt Endnutzern vollen Datenbankzugriff.",
    "appliesWhen": [
      "db:true",
      "auth:true",
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:DATABASE_AGENT"
  },
  {
    "id": "db-normalize-3nf",
    "section": "db",
    "rule": "Schemas in der dritten Normalform (3NF) entwerfen — keine wiederholenden Gruppen, transitiven Abhängigkeiten oder denormalisierten Felder.",
    "rationale": "Denormalisierte Schemas erzeugen Update-Anomalien und Datenkonsistenzprobleme, die mit der Zeit eskalieren.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "should",
    "source": "agent:DATABASE_AGENT"
  },
  {
    "id": "db-query-index-strategy",
    "section": "db",
    "rule": "Für alle WHERE-, ORDER-BY- und JOIN-Spalten in performance-kritischen Queries einen unterstützenden Index anlegen und EXPLAIN ANALYZE vor dem Merge prüfen.",
    "rationale": "Fehlende Indexes verursachen Full-Table-Scans, die über Entwicklungsdatengrößen hinaus nicht skalieren.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "should",
    "source": "agent:DATABASE_AGENT"
  },
  {
    "id": "db-schema-design-before-impl",
    "section": "db",
    "rule": "Für neue Tabellen ein ERD oder DBML-Dokument als Teil des Pull Requests einreichen, bevor die Migration gemergt wird.",
    "rationale": "Schema-Änderungen ohne Design-Review führen zu inkonsistenten Datenmodellen, die teuer zu refaktorieren sind.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "should",
    "source": "agent:DATABASE_AGENT"
  },
  {
    "id": "db-soft-delete-audit-tables",
    "section": "db",
    "rule": "In audit-kritischen und append-only-Tabellen statt eines Hard-DELETE ein Soft-Delete-Muster mit deleted_at-Timestamp verwenden.",
    "rationale": "Hard Deletes in Audit-Tabellen vernichten die forensische Nachvollziehbarkeit und brechen referenzielle Integrität historischer Daten.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "should",
    "source": "agent:DATABASE_AGENT"
  },
  {
    "id": "db-pitr-enabled",
    "section": "maintenance",
    "rule": "Point-in-Time Recovery (PITR) in der Datenbankinfrastruktur aktivieren und regelmäßig einen Restore-Test durchführen.",
    "rationale": "Ohne PITR führen Datenbeschädigung oder versehentliche Löschungen zu permanentem Datenverlust über den letzten Backup-Zeitpunkt hinaus.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "should",
    "source": "agent:DATABASE_AGENT"
  },
  {
    "id": "deps-lockfile-committed",
    "section": "git",
    "rule": "Lockfiles (package-lock.json, yarn.lock, pnpm-lock.yaml) committen und in CI mit --frozen-lockfile installieren.",
    "rationale": "Fehlende oder inkonsistente Lockfiles verursachen Versionsdrift zwischen Umgebungen und unvorhersehbares Produktionsverhalten.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "must",
    "source": "agent:DEPENDENCIES_AGENT"
  },
  {
    "id": "deps-no-critical-cves",
    "section": "security",
    "rule": "Keine kritischen CVEs in Abhängigkeiten zulassen — npm/yarn audit mit --audit-level=critical als CI-Gate einsetzen.",
    "rationale": "Kritische Schwachstellen bieten direkte Angriffsvektoren in Produktivsysteme.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "must",
    "source": "agent:DEPENDENCIES_AGENT"
  },
  {
    "id": "deps-node-version-pinned",
    "section": "maintenance",
    "rule": "Node.js-Version exakt in .nvmrc und package.json engines pinnen — keine Ranges wie >=16.",
    "rationale": "Versionsdrift zwischen Entwicklung und Produktion verursacht schwer reproduzierbare Laufzeitfehler.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "must",
    "source": "agent:DEPENDENCIES_AGENT"
  },
  {
    "id": "deps-supply-chain-scan",
    "section": "security",
    "rule": "Direkte und transitive Abhängigkeiten in CI mit einem Supply-Chain-Scanner (socket.dev, Snyk) auf Malware und Typosquatting prüfen.",
    "rationale": "Kompromittierte transitive Abhängigkeiten sind ein primärer Angriffsvektor für Supply-Chain-Angriffe.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "must",
    "source": "agent:DEPENDENCIES_AGENT"
  },
  {
    "id": "deps-sbom-production",
    "section": "security",
    "rule": "Im Production-Build automatisch ein SBOM (CycloneDX oder Syft) mit allen Abhängigkeiten, Versionen und Lizenzen erzeugen.",
    "rationale": "Ohne Abhängigkeitsinventar können Security-Teams den Impact bei Vulnerability-Disclosures nicht einschätzen.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "should",
    "source": "agent:DEPENDENCIES_AGENT"
  },
  {
    "id": "deps-automated-updates",
    "section": "maintenance",
    "rule": "Dependabot oder Renovate konfigurieren, um Sicherheitsupdates sofort und Minor-Updates gebündelt wöchentlich einzuspielen.",
    "rationale": "Manuelle Dependency-Updates führen zu angehäuften Sicherheitsschulden und verzögertem Patching.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "must",
    "source": "agent:DEPENDENCIES_AGENT"
  },
  {
    "id": "deps-ai-suggested-packages-review",
    "section": "security",
    "rule": "Jede von einem KI-Tool vorgeschlagene neue Abhängigkeit vor dem Merge manuell auf korrekten Paketnamen, Maintainer-Reputation und Security-Scan prüfen.",
    "rationale": "KI-Codegenerierung kann Pakete mit Typosquatting, Sicherheitsproblemen oder ungeeigneten Lizenzen vorschlagen.",
    "severity": "should",
    "source": "agent:DEPENDENCIES_AGENT"
  },
  {
    "id": "deps-build-signing",
    "section": "security",
    "rule": "Container-Images und veröffentlichte npm-Pakete kryptografisch signieren und mit Build-Provenance versehen (sigstore/cosign, npm provenance).",
    "rationale": "Unsignierte Builds können zwischen Veröffentlichung und Deployment unbemerkt manipuliert werden.",
    "severity": "should",
    "source": "agent:DEPENDENCIES_AGENT"
  },
  {
    "id": "design-tokens-only",
    "section": "code-rules",
    "rule": "Ausschließlich Design-Tokens (CSS-Variablen) für Farben, Abstände und Typografie verwenden — keine hardcodierten Hex-, px- oder rgba-Werte.",
    "rationale": "Hardcodierte Werte erzeugen Design-Drift und machen Theming unmöglich.",
    "appliesWhen": [
      "platform:web",
      "platform:native"
    ],
    "severity": "must",
    "source": "agent:DESIGN_SYSTEM_AGENT"
  },
  {
    "id": "no-deprecated-components",
    "section": "code-rules",
    "rule": "Keine als deprecated markierten Komponenten importieren oder verwenden — immer die empfohlene Nachfolge-Komponente nutzen.",
    "rationale": "Deprecated Components enthalten bekannte Bugs, Accessibility-Probleme oder veraltete Muster, die zukünftige Upgrades blockieren.",
    "severity": "must",
    "source": "agent:DESIGN_SYSTEM_AGENT"
  },
  {
    "id": "component-lifecycle-status-required",
    "section": "code-rules",
    "rule": "Jede exportierte Komponente mit einem @lifecycle-JSDoc-Tag (z. B. stable, experimental, deprecated) und @since-Version versehen.",
    "rationale": "Fehlende Lifecycle-Angaben schaffen Unsicherheit über Stabilität und Verwendungsrichtlinien.",
    "severity": "must",
    "source": "agent:DESIGN_SYSTEM_AGENT"
  },
  {
    "id": "semantic-token-usage",
    "section": "code-rules",
    "rule": "In Komponenten-Styles semantische Tokens (--color-primary) statt primitiver Tokens (--blue-500) verwenden.",
    "rationale": "Primitive Tokens koppeln Komponenten an konkrete Werte statt an semantische Bedeutung und erschweren Theming.",
    "severity": "must",
    "source": "agent:DESIGN_SYSTEM_AGENT"
  },
  {
    "id": "theme-via-css-variables",
    "section": "code-rules",
    "rule": "Theme-Wechsel ausschließlich über CSS-Variablen-Swap steuern — keine bedingte Theme-Logik innerhalb von Komponenten.",
    "rationale": "Eingebettete Theme-Logik macht Komponenten komplex und eng an bestimmte Themes gekoppelt.",
    "severity": "must",
    "source": "agent:DESIGN_SYSTEM_AGENT"
  },
  {
    "id": "consistent-component-api",
    "section": "naming",
    "rule": "Standardisierte Prop-Namen für alle Komponenten verwenden — size, variant und disabled statt inputSize, theme oder isDisabled.",
    "rationale": "Inkonsistente Component-APIs erhöhen den kognitiven Aufwand und verringern die Entwicklerproduktivität.",
    "severity": "should",
    "source": "agent:DESIGN_SYSTEM_AGENT"
  },
  {
    "id": "component-documentation-required",
    "section": "maintenance",
    "rule": "Jede öffentliche Komponente mit JSDoc-Beschreibung und einer zugehörigen Storybook-Story ausliefern.",
    "rationale": "Undokumentierte Komponenten führen zu Doppelimplementierungen und erschwerter Adoption.",
    "severity": "should",
    "source": "agent:DESIGN_SYSTEM_AGENT"
  },
  {
    "id": "deprecation-timeline",
    "section": "maintenance",
    "rule": "Jede @deprecated-Annotation mit Migrationsziel-Version, Nachfolge-Komponente und Link zum Migrationsleitfaden versehen.",
    "rationale": "Komponenten ohne klaren Migrationspfad erzeugen technische Schulden und Verwirrung.",
    "severity": "should",
    "source": "agent:DESIGN_SYSTEM_AGENT"
  },
  {
    "id": "dsgvo-privacy-policy-page",
    "section": "structure",
    "rule": "Eine erreichbare Datenschutzerklärung-Seite (z. B. /datenschutz oder /privacy) mit allen Pflichtinformationen bereitstellen.",
    "rationale": "Fehlende Datenschutzerklärung verletzt DSGVO Art. 13/14 und kann sofortige Behördenmaßnahmen auslösen.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:DSGVO_AGENT"
  },
  {
    "id": "dsgvo-imprint-page",
    "section": "structure",
    "rule": "Eine Impressumsseite (z. B. /impressum oder /imprint) mit Angaben zur verantwortlichen Stelle bereitstellen.",
    "rationale": "Pflicht nach TMG §5 und DSGVO Art. 13(1)(a); ohne Impressum ist die Identifikation des Verantwortlichen unmöglich.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:DSGVO_AGENT"
  },
  {
    "id": "dsgvo-cookie-consent-library",
    "section": "security",
    "rule": "Eine anerkannte Consent-Management-Bibliothek (z. B. Cookiebot, Klaro, Usercentrics) einbinden, bevor nicht-essentielle Cookies gesetzt werden.",
    "rationale": "Ohne CMP ist das Setzen von Tracking-Cookies ohne Einwilligung ein Verstoß gegen die ePrivacy-Richtlinie Art. 5(3).",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:DSGVO_AGENT"
  },
  {
    "id": "dsgvo-no-tracking-before-consent",
    "section": "security",
    "rule": "Analytics- und Werbeskripte (gtag, GTM, fbevents, Hotjar usw.) ausschließlich nach expliziter Nutzereinwilligung laden.",
    "rationale": "Vorab-Tracking ohne Consent verstößt gegen DSGVO Art. 7(1) und die ePrivacy-Richtlinie.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:DSGVO_AGENT"
  },
  {
    "id": "dsgvo-no-pii-in-urls-logs",
    "section": "security",
    "rule": "Personenbezogene Daten (E-Mail, Token, Passwort) niemals in URL-Query-Parametern oder Anwendungsprotokollen übertragen oder speichern.",
    "rationale": "PII in URLs und Logs erscheint in Server-Logs, Referrer-Headern und Browser-History und verletzt DSGVO Art. 25/32.",
    "severity": "must",
    "source": "agent:DSGVO_AGENT"
  },
  {
    "id": "dsgvo-password-hashing",
    "section": "security",
    "rule": "Passwörter ausschließlich mit einer starken Hashing-Bibliothek (bcrypt, Argon2, scrypt) speichern — niemals im Klartext.",
    "rationale": "Klartextspeicherung verletzt DSGVO Art. 32(1)(a) zu technischen Sicherheitsmaßnahmen.",
    "appliesWhen": [
      "auth:true"
    ],
    "severity": "must",
    "source": "agent:DSGVO_AGENT"
  },
  {
    "id": "dsgvo-security-headers",
    "section": "security",
    "rule": "HTTPS erzwingen sowie HSTS- und Content-Security-Policy-Header in der Serverkonfiguration setzen.",
    "rationale": "Fehlende Transportverschlüsselung und CSP verletzen DSGVO Art. 32(1)(a); CSP verhindert zusätzlich XSS-basierte Datenlecks.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:DSGVO_AGENT"
  },
  {
    "id": "dsgvo-data-subject-rights-endpoints",
    "section": "structure",
    "rule": "API-Endpunkte für Datenexport (Art. 15/20) und Account-Löschung (Art. 17) implementieren und durch Soft-Delete oder Anonymisierung umsetzen.",
    "rationale": "Fehlende Export- und Löschfunktionen verletzen die Betroffenenrechte nach DSGVO Art. 15, 17 und 20.",
    "appliesWhen": [
      "auth:true"
    ],
    "severity": "must",
    "source": "agent:DSGVO_AGENT"
  },
  {
    "id": "err-timeout-external-calls",
    "section": "error-handling",
    "rule": "Alle externen Aufrufe (fetch, DB-Queries, SDK-Calls) mit Timeout über AbortController oder Library-Option absichern.",
    "rationale": "Externe Services können unbegrenzt hängen und Threads blockieren, was die User Experience degradiert.",
    "severity": "must",
    "source": "agent:ERROR_HANDLING_AGENT"
  },
  {
    "id": "err-retry-transient",
    "section": "error-handling",
    "rule": "Transiente Fehler (Netzwerk, Rate-Limit) mit exponentiellem Backoff und maximalem Retry-Limit erneut versuchen.",
    "rationale": "Temporäre Ausfälle sollen keine dauerhaften nutzersichtbaren Fehler erzeugen.",
    "severity": "should",
    "source": "agent:ERROR_HANDLING_AGENT"
  },
  {
    "id": "err-circuit-breaker",
    "section": "error-handling",
    "rule": "Für kritische externe Abhängigkeiten ein Circuit-Breaker-Pattern einsetzen, das bei wiederholten Fehlern auf einen Fallback umschaltet.",
    "rationale": "Verhindert Kaskadenfehler, wenn externe Services ausgefallen sind.",
    "severity": "should",
    "source": "agent:ERROR_HANDLING_AGENT"
  },
  {
    "id": "err-no-internals-to-client",
    "section": "error-handling",
    "rule": "Stack Traces, Datenbankfehler und interne Systeminformationen nie an den Client weitergeben — nur nutzerfreundliche Nachrichten mit Error-Code zurückgeben.",
    "rationale": "Technische Fehlermeldungen verwirren Nutzer und können sensible Systeminformationen leaken.",
    "severity": "must",
    "source": "agent:ERROR_HANDLING_AGENT"
  },
  {
    "id": "err-structured-types",
    "section": "error-handling",
    "rule": "Nur strukturierte Error-Typen verwenden statt generischer oder geworfener Strings.",
    "rationale": "Strukturierte Fehler ermöglichen es, unterschiedliche Fehlermodi gezielt zu behandeln und konsistentes Feedback zu geben.",
    "severity": "must",
    "source": "agent:ERROR_HANDLING_AGENT"
  },
  {
    "id": "err-api-catch-all",
    "section": "error-handling",
    "rule": "Alle Fehler in API-Routen fangen und eine strukturierte JSON-Fehlerantwort zurückgeben.",
    "rationale": "Ungefangene Fehler in API-Routen stürzen den Server ab und enthüllen interne Details.",
    "severity": "must",
    "source": "agent:ERROR_HANDLING_AGENT"
  },
  {
    "id": "err-validate-before-logic",
    "section": "error-handling",
    "rule": "Eingaben vor der Geschäftslogik validieren.",
    "rationale": "Ungültige Daten verursachen unvorhersehbare Fehler tief in der Geschäftslogik und erschweren das Debugging.",
    "severity": "should",
    "source": "agent:ERROR_HANDLING_AGENT"
  },
  {
    "id": "git-no-force-push-protected",
    "section": "git",
    "rule": "Niemals Force-Pushes auf geschützte Branches (main, release/*) ausführen — stattdessen git revert verwenden.",
    "rationale": "Force-Pushes überschreiben die gemeinsame Historie und zerstören den Audit-Trail für alle Entwickler.",
    "severity": "must",
    "source": "agent:GIT_GOVERNANCE_AGENT"
  },
  {
    "id": "git-require-pr-for-protected-branches",
    "section": "git",
    "rule": "Änderungen an geschützten Branches nur über Pull Requests mit mindestens einem Review einbringen.",
    "rationale": "Direkte Pushes umgehen Code-Review und CI/CD-Validierung und erhöhen das Risiko von Produktionsfehlern.",
    "severity": "must",
    "source": "agent:GIT_GOVERNANCE_AGENT"
  },
  {
    "id": "git-purge-secrets-from-history",
    "section": "security",
    "rule": "Versehentlich committete Secrets restlos aus der Git-Historie entfernen (git filter-repo oder BFG) und Entwickler zum erneuten Klonen auffordern.",
    "rationale": "Secrets bleiben in der Git-Historie zugänglich, auch nachdem sie in einem späteren Commit entfernt wurden; nur ein Überschreiben der Historie entfernt sie wirklich.",
    "severity": "must",
    "source": "agent:GIT_GOVERNANCE_AGENT"
  },
  {
    "id": "git-conventional-commits",
    "section": "git",
    "rule": "Commits nach dem Conventional-Commits-Standard formatieren (type(scope): subject).",
    "rationale": "Ermöglicht automatische Changelog-Generierung, semantische Versionierung und eine maschinell durchsuchbare Commit-Historie.",
    "severity": "must",
    "source": "agent:GIT_GOVERNANCE_AGENT"
  },
  {
    "id": "git-atomic-commits",
    "section": "git",
    "rule": "Jeden Commit auf eine einzige logische Änderung beschränken.",
    "rationale": "Atomare Commits machen git bisect, Cherry-Picking und Rollbacks zuverlässig.",
    "severity": "should",
    "source": "agent:GIT_GOVERNANCE_AGENT"
  },
  {
    "id": "git-semantic-versioning",
    "section": "maintenance",
    "rule": "Versionsnummern strikt nach Semantic Versioning vergeben: MAJOR bei Breaking Changes, MINOR bei Features, PATCH bei Bug Fixes.",
    "rationale": "Vorhersehbares Versionieren hilft Konsumenten, Kompatibilität und Upgrade-Auswirkungen einzuschätzen.",
    "severity": "must",
    "source": "agent:GIT_GOVERNANCE_AGENT"
  },
  {
    "id": "git-codeowners-for-critical-paths",
    "section": "structure",
    "rule": "Kritische Code-Pfade (z.B. /src/auth, /database/migrations) über eine CODEOWNERS-Datei zuständigen Teams zuweisen.",
    "rationale": "Stellt sicher, dass sicherheits- und architekturkritische Änderungen von Fachexperten geprüft werden.",
    "appliesWhen": [
      "auth:true",
      "db:true"
    ],
    "severity": "should",
    "source": "agent:GIT_GOVERNANCE_AGENT"
  },
  {
    "id": "git-descriptive-commit-messages",
    "section": "git",
    "rule": "Aussagekräftige Commit-Nachrichten mit Zusammenfassung und optionalem Body verfassen, die Absicht und Kontext beschreiben.",
    "rationale": "Gute Commit-Nachrichten dienen als Dokumentation und erleichtern Debugging sowie die Nachvollziehbarkeit von Änderungen.",
    "severity": "should",
    "source": "agent:GIT_GOVERNANCE_AGENT"
  },
  {
    "id": "legal-pii-classification",
    "section": "code-rules",
    "rule": "Kennzeichne alle personenbezogenen Datenfelder in Datenmodellen mit PII<T>-Typ oder @PII-Dekorator.",
    "rationale": "Ungetaggte PII kann nicht korrekt geschützt, gelöscht oder auditiert werden — Voraussetzung für DSGVO-Compliance.",
    "severity": "must",
    "appliesWhen": [
      "db:true"
    ],
    "source": "agent:LEGAL_AGENT"
  },
  {
    "id": "legal-ai-transparency-disclosure",
    "section": "code-rules",
    "rule": "Binde in jede UI-Komponente, die KI-generierte Inhalte rendert, eine AICopyrightDisclaimer-Komponente ein.",
    "rationale": "Der EU AI Act verpflichtet zur Transparenz beim Einsatz von KI-Systemen; fehlende Disclosure ist ein Verstoß.",
    "severity": "must",
    "appliesWhen": [
      "platform:web",
      "platform:native"
    ],
    "source": "agent:LEGAL_AGENT"
  },
  {
    "id": "legal-consent-opt-in-only",
    "section": "security",
    "rule": "Setze Consent-UI-Elemente standardmäßig auf nicht aktiviert; keine vorausgewählten Checkboxen oder Toggles.",
    "rationale": "Die DSGVO verlangt ausdrückliche, freiwillige Einwilligung — vorausgewählte Optionen sind unzulässige Dark Patterns und machen die Einwilligung ungültig.",
    "severity": "must",
    "appliesWhen": [
      "platform:web",
      "platform:native"
    ],
    "source": "agent:LEGAL_AGENT"
  },
  {
    "id": "legal-no-pii-in-logs",
    "section": "security",
    "rule": "Flagge PII-annotierte Variablen in Logging-Aufrufen per statischer Analyse.",
    "rationale": "PII-Logging verursacht Datenlecks in weniger gesicherten Speichern und verstößt gegen die DSGVO.",
    "severity": "must",
    "appliesWhen": [
      "db:true"
    ],
    "source": "agent:LEGAL_AGENT"
  },
  {
    "id": "legal-irreversible-data-deletion",
    "section": "db",
    "rule": "Rufe bei Nutzerlöschung AnonymizationService.scrubPII() auf statt eines Soft-Delete.",
    "rationale": "Das DSGVO-Recht auf Vergessenwerden erfordert die dauerhafte Entfernung von PII — Soft Deletes erfüllen diese Anforderung nicht.",
    "severity": "must",
    "appliesWhen": [
      "db:true"
    ],
    "source": "agent:LEGAL_AGENT"
  },
  {
    "id": "legal-third-party-dpa-register",
    "section": "security",
    "rule": "Erfasse alle Drittanbieter, die PII verarbeiten, mit unterzeichnetem Auftragsverarbeitungsvertrag (AVV/DPA) in dpa_register.yml.",
    "rationale": "DSGVO Art. 28 verlangt AVVs mit allen Auftragsverarbeitern — fehlende Einträge begründen gesamtschuldnerische Haftung.",
    "severity": "must",
    "source": "agent:LEGAL_AGENT"
  },
  {
    "id": "legal-document-legal-basis",
    "section": "code-rules",
    "rule": "Versieh jede PII-verarbeitende Funktion mit einem @legal-basis Docblock, der die DSGVO-Rechtsgrundlage (Art. 6) dokumentiert.",
    "rationale": "Die DSGVO erfordert eine dokumentierte Rechtsgrundlage für jede PII-Verarbeitung und dient als Audit-Trail.",
    "severity": "should",
    "appliesWhen": [
      "db:true"
    ],
    "source": "agent:LEGAL_AGENT"
  },
  {
    "id": "legal-gdpr-rights-endpoints",
    "section": "structure",
    "rule": "Implementiere DSGVO-Betroffenenrechte als Endpunkte: /user/export, /user/delete und /user/rectify.",
    "rationale": "Die DSGVO verpflichtet zur Umsetzung von Auskunfts-, Lösch- und Berichtigungsrecht — fehlende Endpunkte verhindern die Einhaltung.",
    "severity": "should",
    "appliesWhen": [
      "platform:web"
    ],
    "source": "agent:LEGAL_AGENT"
  },
  {
    "id": "load-test-scripts-present",
    "section": "testing",
    "rule": "Load-Testing-Skripte (k6, Locust, Artillery oder JMeter) für kritische Anwendungspfade bereitstellen, bevor die App in Production geht.",
    "rationale": "Validiert das Anwendungsverhalten unter realistischer Last und deckt Performance-Engpässe vor der Produktion auf.",
    "severity": "must",
    "source": "agent:LOAD_TEST_AGENT"
  },
  {
    "id": "load-test-min-100-users",
    "section": "testing",
    "rule": "Load-Tests mit mindestens 100 concurrent Users konfigurieren und vor jedem Production-Launch ausführen.",
    "rationale": "Niedrigere User-Zahlen decken keine realistischen Engpässe auf.",
    "severity": "must",
    "source": "agent:LOAD_TEST_AGENT"
  },
  {
    "id": "load-test-thresholds",
    "section": "testing",
    "rule": "Messbare Schwellenwerte in Load-Test-Konfigurationen definieren (z. B. p95-Latenz < 500 ms, Fehlerrate < 1 %).",
    "rationale": "Ohne Thresholds liefert ein Load-Test keine Pass/Fail-Aussage.",
    "severity": "should",
    "source": "agent:LOAD_TEST_AGENT"
  },
  {
    "id": "load-test-npm-script",
    "section": "testing",
    "rule": "Einen 'test:load'-Script-Eintrag in package.json definieren, der den Load-Test ausführt.",
    "rationale": "Einheitlicher Einstiegspunkt macht Load-Tests auffindbar, reproduzierbar und CI-fähig.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "should",
    "source": "agent:LOAD_TEST_AGENT"
  },
  {
    "id": "load-test-ci-integration",
    "section": "testing",
    "rule": "Load-Tests in der CI/CD-Pipeline einbinden, sodass sie automatisch vor einem Release-Deployment laufen.",
    "rationale": "Manuell ausgeführte Load-Tests werden häufig vergessen; CI erzwingt die Ausführung.",
    "severity": "should",
    "source": "agent:LOAD_TEST_AGENT"
  },
  {
    "id": "load-test-docs",
    "section": "maintenance",
    "rule": "Ausführung und Konfiguration der Load-Tests in README.md oder docs/load-testing.md dokumentieren.",
    "rationale": "Stellt sicher, dass Teammitglieder die Lasttests konsistent und korrekt ausführen können.",
    "severity": "should",
    "source": "agent:LOAD_TEST_AGENT"
  },
  {
    "id": "obs-structured-logging",
    "section": "code-rules",
    "rule": "Ausschließlich strukturierte Logger (z.B. pino, winston) mit Pflichtfeldern (timestamp, level, event_name, context) verwenden — kein rohes console.log/warn/error in Anwendungscode.",
    "rationale": "Unstrukturierte Logs sind nicht durchsuchbar, filterbar oder aggregierbar und damit unbrauchbar für Produktions-Debugging, Alerting und Dashboards.",
    "severity": "must",
    "source": "agent:OBSERVABILITY_AGENT_v3"
  },
  {
    "id": "obs-log-naming-schema",
    "section": "naming",
    "rule": "Log-Events nach dem Schema 'domain.action_result' benennen (z.B. 'user.login_success') und Pflichtfelder je Event-Klasse (trace_id, duration_ms, error_type) mitgeben.",
    "rationale": "Konsistente Benennung und Pflichtfelder machen Events suchbar, aggregierbar und auswertbar.",
    "severity": "must",
    "source": "agent:OBSERVABILITY_AGENT_v3"
  },
  {
    "id": "obs-no-pii-in-logs",
    "section": "security",
    "rule": "Keine personenbezogenen Daten (PII) oder Secrets im Klartext loggen.",
    "rationale": "PII in Logs verletzt Datenschutzbestimmungen (DSGVO) und Secrets stellen ein direktes Sicherheitsrisiko dar; einmal im Log-System sind sie nur schwer zuverlässig zu entfernen.",
    "severity": "must",
    "source": "agent:OBSERVABILITY_AGENT_v3"
  },
  {
    "id": "obs-error-severity-classification",
    "section": "error-handling",
    "rule": "Fehler nach Schweregrad klassifizieren (FATAL/ERROR/WARNING/INFO) und den richtigen Level beim Logging verwenden — erwartetes Nutzerverhalten als INFO, nicht als ERROR.",
    "rationale": "Einheitliche Klassifizierung verhindert Alert-Fatigue und ermöglicht zielgerichtetes Routing (Page, Ticket, Monitor).",
    "severity": "must",
    "source": "agent:OBSERVABILITY_AGENT_v3"
  },
  {
    "id": "obs-trace-id-propagation",
    "section": "code-rules",
    "rule": "Jeder HTTP-Anfrage, jedem Background-Job und jeder Queue-Message eine eindeutige Trace-ID zuweisen und diese über alle Downstream-Calls propagieren.",
    "rationale": "Ohne Trace-IDs ist die Korrelation von Log-Einträgen über Service-Grenzen und asynchrone Jobs hinweg unmöglich.",
    "severity": "must",
    "source": "agent:OBSERVABILITY_AGENT_v3"
  },
  {
    "id": "obs-baseline-metrics",
    "section": "maintenance",
    "rule": "Die vier Golden Signals (Traffic, Fehlerrate, Latenz p50/p95/p99, Kapazität) für alle produktiven Deployments erfassen und in einem Dashboard sichtbar machen.",
    "rationale": "Ohne Metriken wird eine Verschlechterung des Systemzustands erst durch Nutzerbeschwerden bemerkt statt proaktiv erkannt.",
    "severity": "must",
    "source": "agent:OBSERVABILITY_AGENT_v3"
  },
  {
    "id": "obs-actionable-alerts",
    "section": "maintenance",
    "rule": "Jeden Alert mit Bedingung, Schwellenwert, Dauer und einer konkreten Response-Aktion (Runbook-Link oder Inline-Schritte) versehen — Alerts ohne definierten Response löschen.",
    "rationale": "Alert-Fatigue durch noise-reiche, aktionslose Alerts führt dazu, dass alle Alerts ignoriert werden.",
    "severity": "should",
    "source": "agent:OBSERVABILITY_AGENT_v3"
  },
  {
    "id": "obs-incident-response-process",
    "section": "maintenance",
    "rule": "Einen minimalen Incident-Response-Prozess (Detect → Assess → Mitigate → Resolve → Document) dokumentieren und Runbooks für die Top-3-Fehlerszenarien anlegen.",
    "rationale": "Ein fehlender Prozess verwandelt einen 30-Minuten-Fix in stundenlange Panik.",
    "severity": "should",
    "source": "agent:OBSERVABILITY_AGENT_v3"
  },
  {
    "id": "perf-core-web-vitals",
    "section": "code-rules",
    "rule": "Core Web Vitals-Schwellenwerte einhalten (LCP < 2,5 s, INP < 200 ms, CLS < 0,1) und Lighthouse CI als PR-Gate konfigurieren.",
    "rationale": "Schlechte Core Web Vitals beeinträchtigen UX, Conversion-Raten und Suchmaschinen-Rankings direkt.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:PERFORMANCE_AGENT"
  },
  {
    "id": "perf-paginate-list-endpoints",
    "section": "db",
    "rule": "Listen-Endpunkte immer mit Paginierung (limit/offset oder Cursor) absichern und unbegrenzte Abfragen ablehnen.",
    "rationale": "Unbegrenzte Queries verursachen exponentiell wachsende DB-Last und Timeouts bei steigenden Datenmengen.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "must",
    "source": "agent:PERFORMANCE_AGENT"
  },
  {
    "id": "perf-bundle-size-limits",
    "section": "code-rules",
    "rule": "Bundle-Größenlimits durchsetzen und nur benötigte Exports statt ganzer Bibliotheken importieren.",
    "rationale": "Große Bundles verzögern kritische Ressourcen und verschlechtern LCP und INP direkt.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:PERFORMANCE_AGENT"
  },
  {
    "id": "perf-image-optimization",
    "section": "code-rules",
    "rule": "Bilder ausschließlich über eine optimierende Komponente mit automatischer WebP/AVIF-Konvertierung und Lazy Loading laden — kein rohes <img> für Content-Bilder.",
    "rationale": "Unoptimierte Bilder sind die häufigste Ursache für langsames LCP und übermäßigen Bandbreitenverbrauch.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:PERFORMANCE_AGENT"
  },
  {
    "id": "perf-detect-n-plus-1",
    "section": "db",
    "rule": "Query-Logging aktivieren und einen N+1-Detektor in die Testsuite integrieren.",
    "rationale": "N+1-Queries verursachen exponentielle Datenbankbelastungen und Produktions-Timeouts.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "should",
    "source": "agent:PERFORMANCE_AGENT"
  },
  {
    "id": "perf-lazy-load-heavy-components",
    "section": "code-rules",
    "rule": "Schwere Komponenten und Routen mit React.lazy oder dynamischen Imports verzögert laden, um das initiale Bundle schlank zu halten.",
    "rationale": "Eager Loading erhöht die initiale Bundle-Größe und verzögert die Time-to-Interactive.",
    "appliesWhen": [
      "stack:react",
      "stack:next"
    ],
    "severity": "should",
    "source": "agent:PERFORMANCE_AGENT"
  },
  {
    "id": "perf-multi-layer-caching",
    "section": "structure",
    "rule": "Mehrschichtige Caching-Strategie über CDN-, API- und Query-Ebene dokumentieren und implementieren.",
    "rationale": "Fehlende Cache-Schichten erzwingen teure Neuberechnungen und DB-Abfragen bei wiederholten Anfragen.",
    "severity": "should",
    "source": "agent:PERFORMANCE_AGENT"
  },
  {
    "id": "perf-api-response-time",
    "section": "code-rules",
    "rule": "API-Endpunkte auf ein p95-Antwortzeit-Ziel von < 300 ms auslegen und per APM-Monitoring auf Regressionen überwachen.",
    "rationale": "Langsame APIs kaskadieren zu schlechter UX und Timeout-Fehlern unter Last.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "should",
    "source": "agent:PERFORMANCE_AGENT"
  },
  {
    "id": "platform-iac-only",
    "section": "maintenance",
    "rule": "Alle Infrastrukturänderungen ausschließlich über genehmigte IaC-Tools (Terraform, Pulumi, CDK) versioniert im Repository durchführen — manuelle Cloud-Console-Änderungen in Produktion sind verboten.",
    "rationale": "Manuelle Änderungen führen zu Konfigurations-Drift, machen Umgebungen inkonsistent und verhindern reproduzierbare Rollbacks.",
    "severity": "must",
    "source": "agent:PLATFORM_AGENT"
  },
  {
    "id": "platform-pipeline-stage-order",
    "section": "structure",
    "rule": "CI/CD-Pipeline-Stages in fester Reihenfolge erzwingen (lint → type-check → unit-tests → build → integration-tests → deploy-staging → e2e-tests → deploy-production) und das Überspringen von Stages verbieten.",
    "rationale": "Übersprungene Validierungsstufen lassen Bugs und Regressionen in die Produktion gelangen.",
    "severity": "must",
    "source": "agent:PLATFORM_AGENT"
  },
  {
    "id": "platform-zero-downtime-deploy",
    "section": "structure",
    "rule": "Deployments ausschließlich als Blue-Green- oder Rolling-Deployment durchführen, sodass kein direktes Stop-Deploy-Start-Muster entsteht.",
    "rationale": "Direktes Ersetzen verursacht Service-Unterbrechungen und schlechte Nutzererfahrung während Releases.",
    "severity": "must",
    "source": "agent:PLATFORM_AGENT"
  },
  {
    "id": "platform-automated-rollback",
    "section": "maintenance",
    "rule": "Automatisierten Rollback-Mechanismus implementieren und in Staging testen — der gesamte Rollback-Prozess muss in unter 5 Minuten abgeschlossen sein.",
    "rationale": "Manuelle Rollbacks unter Incident-Stress sind langsam und fehleranfällig, was Ausfallzeiten verlängert.",
    "severity": "must",
    "source": "agent:PLATFORM_AGENT"
  },
  {
    "id": "platform-multi-az-critical-services",
    "section": "structure",
    "rule": "Kritische Services über mindestens zwei Availability Zones verteilen und dies in der IaC-Konfiguration erzwingen.",
    "rationale": "Single-Zone-Deployments sind ein Single Point of Failure, der bei Zone-Ausfällen zu Totalausfällen führt.",
    "severity": "must",
    "source": "agent:PLATFORM_AGENT"
  },
  {
    "id": "platform-no-hardcoded-secrets",
    "section": "security",
    "rule": "Secret-Scanning-Tools in Pre-Commit und CI konfigurieren, um hartcodierte Geheimnisse zu blockieren.",
    "rationale": "In Code hinterlegte Geheimnisse schaffen kritische Sicherheitslücken.",
    "severity": "must",
    "source": "agent:PLATFORM_AGENT"
  },
  {
    "id": "platform-staging-production-parity",
    "section": "maintenance",
    "rule": "Staging-Umgebung als skalierte, konfigurationsgleiche Replik der Produktion (gleiche DB-Engine, SSL- und Cluster-Konfiguration) per IaC bereitstellen.",
    "rationale": "Umgebungsunterschiede führen zu 'funktioniert in Staging'-Fehlern beim Produktions-Deployment.",
    "severity": "should",
    "source": "agent:PLATFORM_AGENT"
  },
  {
    "id": "platform-health-endpoints",
    "section": "structure",
    "rule": "Jeden Service mit standardisierten /health- und /ready-Endpunkten nach Kubernetes-Probe-Muster ausstatten und in den Service-Manifests konfigurieren.",
    "rationale": "Services ohne Health-Checks können nicht zuverlässig überwacht, in Load-Balancer integriert oder automatisch neu gestartet werden.",
    "severity": "should",
    "source": "agent:PLATFORM_AGENT"
  },
  {
    "id": "scale-no-memory-session",
    "section": "structure",
    "rule": "Speichere Session-State in einem externen Store (Redis, Datenbank) statt im App-Server-Memory.",
    "rationale": "In-Memory-Sessions verhindern horizontales Skalieren und führen bei Deployments zu Datenverlust.",
    "appliesWhen": [
      "stack:node",
      "stack:python",
      "stack:rails",
      "stack:go",
      "stack:php",
      "stack:java",
      "stack:dotnet",
      "auth:true"
    ],
    "severity": "must",
    "source": "agent:SCALABILITY_AGENT"
  },
  {
    "id": "scale-long-ops-job-queue",
    "section": "structure",
    "rule": "Lagere Operationen, die länger als 3 Sekunden dauern, in eine Job-Queue (z. B. BullMQ, SQS) aus und gib sofort eine Job-ID zurück.",
    "rationale": "Synchrone Langoperationen blockieren Request-Threads und verschlechtern die Performance unter Last.",
    "appliesWhen": [
      "stack:node",
      "stack:python",
      "stack:rails",
      "stack:go",
      "stack:php",
      "stack:java",
      "stack:dotnet"
    ],
    "severity": "must",
    "source": "agent:SCALABILITY_AGENT"
  },
  {
    "id": "scale-optimistic-update-rollback",
    "section": "error-handling",
    "rule": "Versehe optimistische UI-Updates immer mit einem onError-Rollback-Handler, der den vorherigen Zustand wiederherstellt.",
    "rationale": "Fehlende Rollbacks hinterlassen die UI in inkonsistenten Zuständen, wenn Operationen fehlschlagen.",
    "appliesWhen": [
      "stack:react",
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:SCALABILITY_AGENT"
  },
  {
    "id": "scale-server-state-via-query",
    "section": "code-rules",
    "rule": "Verwalte Server-Daten ausschließlich über React Query oder SWR und beschränke useState auf lokalen Komponenten-State.",
    "rationale": "Gemischtes Server-/Client-State führt zu Cache-Inkonsistenzen und unnötigen API-Aufrufen.",
    "appliesWhen": [
      "stack:react",
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:SCALABILITY_AGENT"
  },
  {
    "id": "scale-global-store-boundaries",
    "section": "structure",
    "rule": "Beschränke den globalen Store auf Auth- und Theme-Daten; lagere Filter, Pagination und sonstige URL-taugliche Zustände in den Router-Query aus.",
    "rationale": "Überladene Global Stores werden zum Performance-Engpass, wenn komponentenlokale Daten darin landen.",
    "appliesWhen": [
      "stack:react",
      "stack:next",
      "stack:vue",
      "stack:nuxt",
      "stack:svelte",
      "platform:web"
    ],
    "severity": "should",
    "source": "agent:SCALABILITY_AGENT"
  },
  {
    "id": "scale-load-test-documentation",
    "section": "testing",
    "rule": "Dokumentiere Lasttest-Ergebnisse (Szenarien, Zielmetriken, Baseline, Bottlenecks) vor jedem Major-Release.",
    "rationale": "Unbekannte Skalierungsgrenzen führen zu ungeplanten Ausfällen unter Produktionslast.",
    "severity": "should",
    "source": "agent:SCALABILITY_AGENT"
  },
  {
    "id": "scale-runbook",
    "section": "maintenance",
    "rule": "Pflege ein Scaling-Runbook mit priorisierten Bottlenecks, Monitoring-Schwellwerten und Skalierungsbefehlen.",
    "rationale": "Fehlende Runbooks erzwingen improvisierende Reaktionen während Traffic-Spitzen.",
    "severity": "should",
    "source": "agent:SCALABILITY_AGENT"
  },
  {
    "id": "sec-prevent-sql-injection",
    "section": "security",
    "rule": "Datenbankabfragen ausschließlich mit parametrisierten Statements oder ORM-Methoden ausführen; niemals Nutzereingaben per String-Konkatenation einbauen.",
    "rationale": "SQL-Injection ermöglicht das Lesen, Ändern oder Löschen beliebiger Daten und kompromittiert die gesamte Datenbank.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:SECURITY_AGENT_FINAL"
  },
  {
    "id": "no-secrets-in-code",
    "section": "security",
    "rule": "Keine Secrets im Code hardcoden oder committen; ausschließlich über Umgebungsvariablen oder Secret-Manager beziehen.",
    "rationale": "Ein geleaktes Secret gefährdet das gesamte System.",
    "severity": "must",
    "source": "agent:SECURITY_AGENT_FINAL"
  },
  {
    "id": "sec-http-security-headers",
    "section": "security",
    "rule": "Baseline-Security-Header (CSP, HSTS, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy) zentral konfigurieren und in allen Responses ausliefern.",
    "rationale": "Fehlende Header ermöglichen Clickjacking, MIME-Sniffing und Cross-Site-Angriffe; einmalige Einrichtung bietet dauerhaften Schutz.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:SECURITY_AGENT_FINAL"
  },
  {
    "id": "sec-rate-limit-endpoints",
    "section": "security",
    "rule": "Rate-Limiting für alle öffentlichen und auth-relevanten Endpunkte durchsetzen; Auth-Endpunkte am restriktivsten und kostenintensive Operationen separat begrenzen.",
    "rationale": "Ohne Rate-Limiting sind Brute-Force, Scraping, Kostenexplosion und Denial-of-Service möglich.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:SECURITY_AGENT_FINAL"
  },
  {
    "id": "sec-restrictive-cors",
    "section": "security",
    "rule": "CORS nur für bekannte, explizit aufgelistete Origins erlauben; niemals Wildcard (*) in Produktion verwenden.",
    "rationale": "Permissive CORS erlaubt fremden Origins das Lesen von API-Antworten und hebelt den Sitzungsschutz aus.",
    "appliesWhen": [
      "platform:web"
    ],
    "severity": "must",
    "source": "agent:SECURITY_AGENT_FINAL"
  },
  {
    "id": "secure-session-cookies",
    "section": "security",
    "rule": "Session-Cookies mit HttpOnly, Secure und SameSite=Lax/Strict konfigurieren und geschützte Endpunkte nie ohne Authentifizierung erreichbar machen.",
    "rationale": "Verhindert Session-Hijacking durch XSS und schützt vor CSRF-Angriffen sowie unautorisiertem Zugriff.",
    "appliesWhen": [
      "platform:web",
      "auth:true"
    ],
    "severity": "must",
    "source": "agent:SECURITY_AGENT_FINAL"
  },
  {
    "id": "sec-crypto-standards",
    "section": "security",
    "rule": "Passwörter mit bcrypt (Cost ≥ 12) oder Argon2 hashen, symmetrische Verschlüsselung mit AES-256-GCM und ausschließlich CSPRNG für Tokens/Salts nutzen; niemals eigene Kryptografie.",
    "rationale": "Schwache Kryptografie führt zu Datenlecks, Auth-Bypässen und Integritätsverletzungen.",
    "severity": "must",
    "source": "agent:SECURITY_AGENT_FINAL"
  },
  {
    "id": "sec-error-no-sensitive-leak",
    "section": "error-handling",
    "rule": "Niemals Stack-Traces, DB-Details oder interne Pfade in Client-Fehlermeldungen senden und keine sensiblen Daten (Passwörter, Tokens, Zahlungsdaten) in Logs schreiben.",
    "rationale": "Detaillierte Fehler- und Log-Informationen verraten Angreifern die Systemarchitektur und schaffen Compliance-Verstöße.",
    "severity": "must",
    "source": "agent:SECURITY_AGENT_FINAL"
  },
  {
    "id": "sec-no-sql-injection",
    "section": "security",
    "rule": "Niemals Benutzereingaben per String-Interpolation in SQL-, NoSQL- oder Shell-Queries einbauen — ausschließlich parametrisierte Abfragen oder ORM-Methoden verwenden.",
    "rationale": "SQL-Injection via Template-Literale ist die am häufigsten ausgenutzte Web-Schwachstelle und ermöglicht vollständigen Datenbankzugriff.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:SECURITY_SCAN_AGENT"
  },
  {
    "id": "sec-no-eval-dynamic",
    "section": "security",
    "rule": "eval() und new Function() mit dynamischem oder nutzergesteuertem Input vollständig verbieten — JSON.parse() für Daten und AST-Transforms für Code verwenden.",
    "rationale": "eval() mit nutzergesteuertem Input ist Remote Code Execution — ein einziger Aufruf kompromittiert den gesamten Server.",
    "severity": "must",
    "source": "agent:SECURITY_SCAN_AGENT"
  },
  {
    "id": "sec-no-path-traversal",
    "section": "security",
    "rule": "Dateisystem-Operationen dürfen keine nutzerkontrollierten Pfade ohne path.resolve()-Validierung und Allowlist-Prüfung akzeptieren.",
    "rationale": "Pfad-Traversal mit ../../etc/passwd liest beliebige Server-Dateien inklusive Secrets und SSH-Keys.",
    "appliesWhen": [
      "stack:node"
    ],
    "severity": "must",
    "source": "agent:SECURITY_SCAN_AGENT"
  },
  {
    "id": "sec-no-ssrf",
    "section": "security",
    "rule": "Nutzerkontrollierte URLs nie direkt an fetch/axios übergeben — vorher gegen eine strikte Allowlist validieren.",
    "rationale": "SSRF ermöglicht Angreifern den Zugriff auf interne Dienste wie Cloud-Metadata-Endpoints, die vom Internet unerreichbar sein sollten.",
    "severity": "must",
    "source": "agent:SECURITY_SCAN_AGENT"
  },
  {
    "id": "sec-no-token-localstorage",
    "section": "security",
    "rule": "Auth-Tokens, JWTs und Session-IDs niemals in localStorage speichern — ausschließlich httpOnly-Cookies verwenden.",
    "rationale": "localStorage ist für jedes JavaScript zugänglich, auch XSS-Payloads. httpOnly-Cookies sind für JS unsichtbar.",
    "appliesWhen": [
      "platform:web",
      "auth:true"
    ],
    "severity": "must",
    "source": "agent:SECURITY_SCAN_AGENT"
  },
  {
    "id": "sec-strong-crypto",
    "section": "security",
    "rule": "Für Tokens und Session-IDs crypto.randomUUID() oder crypto.getRandomValues() verwenden — Math.random(), MD5 und SHA-1 für Sicherheitszwecke sind verboten.",
    "rationale": "Math.random() ist vorhersagbar; MD5/SHA-1 sind kollisionsanfällig — beide ermöglichen Token-Prediction-Angriffe.",
    "severity": "must",
    "source": "agent:SECURITY_SCAN_AGENT"
  },
  {
    "id": "sec-no-llm-output-exec",
    "section": "security",
    "rule": "LLM-Ausgaben niemals an eval() oder innerHTML übergeben — HTML mit DOMPurify sanitisieren, Code in isolierter Sandbox transformieren.",
    "rationale": "LLM-Output via eval() oder innerHTML auszuführen macht Prompt-Injection zu vollem XSS/RCE.",
    "severity": "must",
    "source": "agent:SECURITY_SCAN_AGENT"
  },
  {
    "id": "sec-no-mass-assignment",
    "section": "security",
    "rule": "Bei Datenbank-Updates req.body nie direkt spreaden — nur explizit aufgelistete Felder per Destructuring übernehmen.",
    "rationale": "Mass Assignment erlaubt Angreifern, privilegierte Felder wie role oder organization_id unkontrolliert zu überschreiben.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:SECURITY_SCAN_AGENT"
  },
  {
    "id": "slop-no-placeholder-comments",
    "section": "code-rules",
    "rule": "Entferne KI-Platzhalter-Kommentare wie '// TODO: implement', '// Add your logic here' oder '// This is a placeholder' und ersetze sie durch echte Implementierungen oder referenzierte Tickets.",
    "rationale": "Solche Kommentare kennzeichnen unfertige KI-generierte Stubs, die nicht in Produktion gelangen dürfen.",
    "severity": "must",
    "source": "agent:SLOP_DETECTION_AGENT"
  },
  {
    "id": "slop-no-placeholder-credentials",
    "section": "security",
    "rule": "Ersetze Platzhalter-Credentials wie 'YOUR_API_KEY_HERE', 'INSERT_YOUR_TOKEN' oder 'YOUR_SECRET_HERE' durch Referenzen auf Umgebungsvariablen.",
    "rationale": "Ungefüllte KI-Vorlagen in committetem Code führen zu vergessenen Konfigurationen, Laufzeitfehlern oder Sicherheitslücken.",
    "appliesWhen": [
      "platform:web",
      "platform:native",
      "db:true",
      "auth:true"
    ],
    "severity": "must",
    "source": "agent:SLOP_DETECTION_AGENT"
  },
  {
    "id": "slop-no-ai-tool-fingerprints",
    "section": "code-rules",
    "rule": "Entferne KI-Tool-Fingerprints wie '// Generated by Lovable', '/* AI-generated */' oder 'Copilot suggestion' nach dem Review aus dem produktiven Quellcode.",
    "rationale": "Solche Metadaten bieten keinen Wartungsmehrwert und signalisieren ungeprüften, generierten Code.",
    "severity": "should",
    "source": "agent:SLOP_DETECTION_AGENT"
  },
  {
    "id": "slop-no-overcommenting",
    "section": "code-rules",
    "rule": "Halte das Verhältnis von Kommentar- zu Codezeilen unter 40 % und kommentiere nur das 'Warum', nicht jeden trivialen Schritt.",
    "rationale": "Ein hohes Kommentar-zu-Code-Verhältnis ist ein typisches Merkmal unkontrolliert KI-generierten Codes, der den Code lediglich nacherzählt.",
    "severity": "should",
    "source": "agent:SLOP_DETECTION_AGENT"
  },
  {
    "id": "slop-consistent-comment-language",
    "section": "code-rules",
    "rule": "Verwende eine einheitliche Kommentarsprache innerhalb eines Projekts.",
    "rationale": "Sprachmischungen entstehen typischerweise durch mehrere KI-Sessions mit unterschiedlichen Prompt-Sprachen und erschweren die Lesbarkeit.",
    "severity": "should",
    "source": "agent:SLOP_DETECTION_AGENT"
  },
  {
    "id": "spec-ai-context-file-substantive",
    "section": "maintenance",
    "rule": "Pflege eine substantielle KI-Kontext-Datei (.cursorrules, CLAUDE.md o.ä.) mit mindestens 200 Zeichen Inhalt.",
    "rationale": "Fehlender oder zu kurzer KI-Kontext führt zu generischen Vermutungen statt projektspezifischem Code.",
    "severity": "should",
    "source": "agent:SPEC_AGENT"
  },
  {
    "id": "spec-cursorrules-contains-stack",
    "section": "maintenance",
    "rule": "Gib den Tech-Stack explizit in der KI-Kontext-Datei an (z.B. \"Tech Stack: Next.js 15 / Supabase / TypeScript / Tailwind\").",
    "rationale": "Ohne Stack-Kontext generiert das KI-Tool Framework-agnostischen Code statt passgenauen.",
    "severity": "should",
    "source": "agent:SPEC_AGENT"
  },
  {
    "id": "spec-prd-present",
    "section": "structure",
    "rule": "Halte ein Requirements-Dokument (docs/PRD.md, SPEC.md o.ä.) mit Problemstellung, Zielnutzer, Kern-Features und Out-of-Scope bereit.",
    "rationale": "Ohne schriftliche Anforderungen generiert KI was sie vermutet — Implementation-Drift ist die häufigste Folge.",
    "severity": "should",
    "source": "agent:SPEC_AGENT"
  },
  {
    "id": "spec-readme-no-drift",
    "section": "maintenance",
    "rule": "Halte das README mit dem tatsächlichen Tech-Stack synchron — erwähnte Packages müssen in package.json vorhanden sein.",
    "rationale": "Veraltete Technologie-Angaben im README veranlassen KI-Tools, nicht mehr verwendete Libraries zu nutzen.",
    "severity": "should",
    "source": "agent:SPEC_AGENT"
  },
  {
    "id": "testing-ci-gate",
    "section": "testing",
    "rule": "CI so konfigurieren, dass fehlschlagende Tests einen Merge in den Haupt-Branch blockieren — als required status check.",
    "rationale": "Defekte Tests im Haupt-Branch blockieren alle Entwickler und untergraben das Vertrauen in die Codebasis.",
    "severity": "must",
    "source": "agent:TESTING_AGENT"
  },
  {
    "id": "testing-coverage-threshold",
    "section": "testing",
    "rule": "Mindestens 80 % Testabdeckung für neue oder geänderte Geschäftslogik im Coverage-Tool erzwingen.",
    "rationale": "Ungeprüfte Logik kann bei Refactorings lautlos brechen.",
    "severity": "must",
    "source": "agent:TESTING_AGENT"
  },
  {
    "id": "testing-regression-on-bugfix",
    "section": "testing",
    "rule": "Jeden Bugfix mit einem Regressionstest absichern, der vor dem Fix fehlschlägt und danach besteht.",
    "rationale": "Ohne Regressionstest kehren behobene Fehler zurück und verschwenden Vertrauen und Engineering-Zeit.",
    "severity": "must",
    "source": "agent:TESTING_AGENT"
  },
  {
    "id": "testing-pyramid-balance",
    "section": "testing",
    "rule": "Testpyramide einhalten: mehrheitlich Unit-Tests, moderate Integrationstests, wenige E2E-Tests.",
    "rationale": "Eine invertierte Pyramide erzeugt langsame, fragile Suiten, die Entwickler meiden.",
    "severity": "should",
    "source": "agent:TESTING_AGENT"
  },
  {
    "id": "testing-api-real-db",
    "section": "testing",
    "rule": "API-Integrationstests gegen eine echte Test-Datenbank ausführen, nicht gegen Mocks oder In-Memory-Fakes.",
    "rationale": "Nur echte DB-Verbindungen decken Migrations- und Persistenzfehler auf.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:TESTING_AGENT"
  },
  {
    "id": "testing-ai-code-coverage",
    "section": "testing",
    "rule": "KI-generierten Code mit mindestens 90 % Testabdeckung und einem zusätzlichen Security-Review versehen.",
    "rationale": "KI-Code enthält häufig subtile Logikfehler oder übersieht Edge-Cases und benötigt höhere Prüfstrenge.",
    "severity": "must",
    "source": "agent:TESTING_AGENT"
  },
  {
    "id": "testing-e2e-critical-paths",
    "section": "testing",
    "rule": "Kritische Benutzerpfade (z. B. Registrierung, Login, Checkout) mit E2E-Tests in produktionsnaher Umgebung abdecken.",
    "rationale": "Fehler in kritischen Benutzerpfaden haben direkte negative Auswirkungen auf das Geschäft.",
    "appliesWhen": [
      "platform:web",
      "platform:native",
      "auth:true"
    ],
    "severity": "should",
    "source": "agent:TESTING_AGENT"
  },
  {
    "id": "testing-test-data-factories",
    "section": "testing",
    "rule": "Testdaten ausschließlich über Factories generieren — niemals Produktionsdaten, hartkodierte IDs oder sensible Felder in Fixtures.",
    "rationale": "Hartkodierte oder reale Produktionsdaten machen Tests fragil und erzeugen Sicherheitsrisiken.",
    "appliesWhen": [
      "db:true"
    ],
    "severity": "must",
    "source": "agent:TESTING_AGENT"
  }
]
