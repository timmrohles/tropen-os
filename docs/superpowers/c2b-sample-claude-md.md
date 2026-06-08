## Code-Regeln (nicht verhandelbar)
- **Pflicht:** Dateien > 300 Zeilen sind eine Warnung, > 500 eine Verletzung — aufteilen. (Lesbarkeit & Wartbarkeit)
- **Pflicht:** Kein `any` ohne Kommentar mit Begründung; TypeScript strict aktivieren.
- **Pflicht:** Keine Business-Logik in UI-Komponenten oder Seiten — in /lib oder /actions auslagern.
- Empfehlung: Auskommentierten Code und ungenutzte Importe entfernen statt liegen lassen.
- Empfehlung: Eine Funktion erledigt genau eine Aufgabe — bei mehreren Aufgaben aufteilen.
- Empfehlung: Magische Zahlen und Strings als benannte Konstanten extrahieren.
- Empfehlung: Reine Funktionen bevorzugen — Seiteneffekte explizit und gebündelt halten.
- Empfehlung: <button> für Aktionen, <a href> für Navigation — nie <div onClick>.
- Empfehlung: Kein Daten-Fetch direkt in useEffect ohne Abbruch/Dedupe — Server Components oder Query-Layer bevorzugen.
- Empfehlung: Stabile keys in Listen verwenden — nie der Array-Index bei dynamischen Listen.
- Empfehlung: Ableitbare Werte direkt im Render berechnen statt redundant im State zu spiegeln.
- Empfehlung: Fokus-Indikator sichtbar halten, Tastatur-Bedienbarkeit sicherstellen, aria-label für Icon-Buttons setzen.
- Empfehlung: Lade- und Fehlerzustände für asynchrone UI explizit rendern.

## Namenskonventionen
- **Pflicht:** React-Komponenten PascalCase benennen (UserProfile.tsx).
- **Pflicht:** Custom Hooks camelCase mit use-Präfix benennen (useUserProfile.ts).
- Empfehlung: Konstanten-Werte in UPPER_SNAKE_CASE benennen (MAX_RETRY_COUNT).
- Empfehlung: Ordner in kebab-case benennen (user-management/).
- Empfehlung: Utilities und Helper in camelCase benennen (formatDate.ts).
- Empfehlung: Namen beschreiben Absicht, nicht Implementierung — keine Abkürzungen wie d, tmp, x.
- Empfehlung: Boolean-Variablen mit is/has/should-Präfix benennen (isLoading, hasError).
- Empfehlung: Benenne Übersetzungsschlüssel hierarchisch nach dem Muster feature.component.action (z.B. buttons.save.loading) statt flacher Strukturen. (Hierarchische Schlüssel erleichtern Pflege und Auffindbarkeit von Übersetzungen.)
- Empfehlung: Verwende standardisierte Prop-Namen wie size, variant und disabled statt Varianten wie inputSize, theme oder isDisabled. (Konsistente Prop-Namen über Komponenten hinweg reduzieren kognitive Last und verbessern die Wiederverwendbarkeit.)
- Empfehlung: Benenne Log-Events nach dem Schema 'domain.action_result' (z.B. 'user.login_success') und gib Pflichtfelder je Event-Klasse mit (trace_id, duration_ms, error_type). (Einheitliche Event-Namen und Pflichtfelder ermöglichen konsistentes Logging und Auswertbarkeit.)

## Ordnerstruktur & was gehört wohin
- **Pflicht:** Klare Schichten trennen: UI (components) / Logik (lib, actions) / Daten (db).
- Empfehlung: Routing-Ordner enthalten nur Routing — kein Business-Code.
- Empfehlung: Was zusammen geändert wird, liegt zusammen — nach Verantwortung schneiden, nicht nach technischem Layer.
- Empfehlung: Ordnertiefe begrenzen — bei mehr als drei Ebenen flacher umstrukturieren.
- Empfehlung: Öffentliche API eines Moduls über einen index-Export bündeln, Internas privat halten.
- Empfehlung: Server Components als Default — 'use client' nur dort, wo Interaktivität nötig ist.

## Datenbank-Zugriff & Migrationen
- **Pflicht:** Kein direkter DB-Zugriff aus dem Frontend — immer über eine Server-Schicht.
- **Pflicht:** Schema-Änderungen zuerst als versionierte Migrationsdatei committen, dann anwenden.
- **Pflicht:** Row-Level-Security bzw. Tenant-Filter auf jeder mandantenbezogenen Tabelle erzwingen.
- Empfehlung: Nur benötigte Spalten selektieren statt SELECT * über breite Tabellen.
- Empfehlung: Fremdschlüssel und häufig gefilterte Spalten indizieren.
- Empfehlung: N+1-Queries vermeiden — Daten gebündelt laden (join/batch) statt im Loop.
- **Pflicht:** Aktiviere Point-in-Time Recovery mit mindestens 7 Tagen Aufbewahrung für alle Produktionsdatenbanken. (Ermöglicht Wiederherstellung nach Datenverlust oder fehlerhaften Operationen.)
- **Pflicht:** Versioniere Migrationen sequenziell und stelle für jede eine umkehrbare Down-Migration bereit. (Sichert kontrollierte Rollbacks und nachvollziehbare Schema-Historie.)
- Empfehlung: Entwirf Schemas in dritter Normalform ohne wiederholende Gruppen oder transitive Abhängigkeiten, sofern keine bewusste Denormalisierung begründet ist. (Reduziert Redundanz und Anomalien bei Datenänderungen.)
- **Pflicht:** Prüfe performance-kritische Queries mit EXPLAIN ANALYZE vor dem Merge und lege unterstützende Indizes für WHERE-, ORDER-BY- und JOIN-Spalten an. (Verhindert langsame Queries und nicht genutzte Indizes in Produktion.)
- Empfehlung: Reiche für neue Tabellen ein ERD oder DBML-Dokument als Teil des Pull Requests ein, bevor die Migration gemergt wird. (Macht Datenmodell-Änderungen reviewbar und dokumentiert.)
- Empfehlung: Verwende in audit-kritischen und append-only-Tabellen ein Soft-Delete-Muster mit deleted_at-Timestamp statt Hard-DELETE. (Erhält Historie und ermöglicht Wiederherstellung.)
- Empfehlung: Aktiviere Query-Logging und integriere einen N+1-Detektor in die Testsuite. (Deckt ineffiziente Query-Muster früh automatisiert auf.)

## Fehlerbehandlung
- **Pflicht:** Standardisierte Error-Typen verwenden statt roher throws.
- **Pflicht:** API-Routen in try/catch kapseln und strukturierte JSON-Response { error, code? } liefern.
- Empfehlung: Nie generische Messages an den Client geben — spezifisch und hilfreich formulieren.
- **Pflicht:** Keine leeren catch-Blöcke — Fehler loggen oder gezielt behandeln.
- Empfehlung: Ungültige Eingaben früh abweisen (fail fast) statt durch die Logik schleifen lassen.
- Empfehlung: Beim Weiterwerfen die ursprüngliche Fehlerursache erhalten (cause), nicht verschlucken.
- **Pflicht:** Gib niemals Stack-Traces, DB-Details oder interne Pfade an den Client weiter und schreibe keine sensiblen Daten (Passwörter, Tokens) in Logs. (Verhindert Information-Leakage und schützt vor Angriffsflächen.)
- **Pflicht:** Sichere alle externen Aufrufe (fetch, DB-Queries, SDK-Calls) mit einem Timeout über AbortController oder Library-Option ab. (Verhindert hängende Requests und Ressourcen-Leaks.)
- Empfehlung: Wiederhole transiente Fehler (Netzwerk, Rate-Limit) mit exponentiellem Backoff und einem maximalen Retry-Limit. (Erhöht Resilienz ohne Überlastung der Gegenseite.)
- Empfehlung: Setze für kritische externe Abhängigkeiten ein Circuit-Breaker-Pattern mit Fallback ein, das bei wiederholten Fehlern umschaltet. (Schützt das System vor kaskadierenden Ausfällen.)
- Empfehlung: Klassifiziere Fehler nach Schweregrad (FATAL/ERROR/WARNING/INFO) und logge mit dem passenden Level — erwartetes Nutzerverhalten als INFO, nicht als ERROR. (Hält Alerts aussagekräftig und reduziert Rauschen.)
- **Pflicht:** Validiere alle KI-Ausgaben vor der Weiterverarbeitung mit einem Schema und speichere oder rendere rohe AI-Responses nie direkt. (Modell-Ausgaben sind unzuverlässig und potenziell unsicher.)
- Empfehlung: Sichere jeden KI-Service-Aufruf mit einer Fallback-Strategie (alternativer Provider, Circuit-Breaker oder gecachte Antwort) ab. (AI-Provider sind häufig instabil oder rate-limitiert.)
- Empfehlung: Versehe optimistische UI-Updates mit einem onError-Rollback-Handler, der den vorherigen Zustand wiederherstellt. (Verhindert inkonsistente UI bei fehlgeschlagenen Mutationen.)

## Tests
- Empfehlung: Stelle Load-Test-Skripte (k6, Locust, Artillery, JMeter) für kritische Pfade mit mindestens 100 concurrent Users bereit und führe sie vor jedem Production-Launch aus. (Performance-Regressionen werden vor dem Release sichtbar.)
- Empfehlung: Definiere messbare Schwellenwerte in Load-Test-Konfigurationen (z. B. p95-Latenz < 500 ms, Fehlerrate < 1 %) und dokumentiere Szenarien, Baseline und Bottlenecks vor jedem Major-Release. (Ohne klare Zielmetriken sind Lasttest-Ergebnisse nicht bewertbar.)
- Empfehlung: Binde Load-Tests in die CI/CD-Pipeline ein, sodass sie automatisch vor einem Release-Deployment laufen.
- **Pflicht:** Konfiguriere CI so, dass fehlschlagende Tests einen Merge in den Haupt-Branch als required status check blockieren. (Verhindert, dass defekter Code in die Hauptlinie gelangt.)
- **Pflicht:** Erzwinge mindestens 80 % Testabdeckung für neue oder geänderte Geschäftslogik und sichere jeden Bugfix mit einem Regressionstest ab, der vor dem Fix fehlschlägt und danach besteht. (Coverage-Mindestmaß und Regressionstests verhindern Wiederholungsfehler.)
- Empfehlung: Halte die Testpyramide ein: mehrheitlich Unit-Tests, moderate Integrationstests, wenige E2E-Tests.
- Empfehlung: Führe quartalsweise automatisierte Restore-Tests durch und dokumentiere die Ergebnisse.
- Empfehlung: Führe API-Integrationstests gegen eine echte Test-Datenbank aus, nicht gegen Mocks oder In-Memory-Fakes. (Echte DB-Verhalten und Constraints werden nur so verifiziert.)
- **Pflicht:** Generiere Testdaten ausschließlich über Factories — niemals Produktionsdaten, hartkodierte IDs oder sensible Felder in Fixtures.
- **Pflicht:** Versieh KI-generierten Code mit mindestens 90 % Testabdeckung und einem zusätzlichen Security-Review.
- **Pflicht:** Decke kritische Benutzerpfade (Registrierung, Login, Checkout) mit E2E-Tests in produktionsnaher Umgebung ab.

## Git & Versionskontrolle
- **Pflicht:** Führe niemals Force-Pushes auf geschützte Branches (main, release/*) aus und nutze stattdessen git revert.
- **Pflicht:** Bringe Änderungen an geschützten Branches nur über Pull Requests mit mindestens einem Review ein.
- Empfehlung: Formatiere Commits nach dem Conventional-Commits-Standard (type(scope): subject) mit aussagekräftiger Zusammenfassung und optionalem Body, der Absicht und Kontext beschreibt.
- Empfehlung: Beschränke jeden Commit auf eine einzige logische Änderung.

## Sicherheit & Secrets
- **Pflicht:** Keine Secrets im Code oder in der Git-History ablegen.
- **Pflicht:** Auth-Check als erste Zeile jeder geschützten Route ausführen.
- Empfehlung: Kein PII in Logs schreiben; structured logging statt console.log nutzen.
- **Pflicht:** Eingaben serverseitig validieren (z.B. Zod) vor jeder Business-Logik.
- **Pflicht:** Konfiguration und Secrets über Environment-Variablen laden, nie hartkodieren.
- Empfehlung: Geringste nötige Berechtigung vergeben — Service-Keys nie an den Client geben.
- **Pflicht:** Server-Secrets nie in Client Components importieren oder über NEXT_PUBLIC_ exponieren.
- **Pflicht:** Session/Token serverseitig prüfen — nie nur clientseitig verstecken.
- **Pflicht:** Tokens, Passwörter und Session-IDs niemals loggen oder in URLs weitergeben.
- **Pflicht:** Niemals Karten- oder Zahlungsdaten selbst speichern — einen PSP (Stripe o.ä.) nutzen.
- **Pflicht:** Preise und Beträge serverseitig berechnen und verifizieren — nie dem Client-Wert vertrauen.
- **Pflicht:** User-Input niemals in System-Prompts interpolieren — stets als separate Nachricht mit Rolle 'user' übergeben. (Verhindert Prompt-Injection.)
- **Pflicht:** Alle LLM- und KI-Endpunkte mit per-User- und globalem Rate-Limit absichern. (Begrenzt Missbrauch und Kosten.)
- **Pflicht:** LLM-Ausgaben niemals an eval() oder innerHTML übergeben — HTML mit DOMPurify sanitisieren und Code nur in isolierter Sandbox transformieren. (Verhindert XSS und Code-Execution durch generierte Inhalte.)
- **Pflicht:** Jede von einem KI-Tool vorgeschlagene Abhängigkeit vor dem Merge manuell auf Paketname, Maintainer-Reputation und Security-Scan prüfen. (Schützt vor halluzinierten oder bösartigen Paketen.)
- **Pflicht:** Keine PII (E-Mails, Namen, rohe User-IDs) in Analytics-Events senden — ausschließlich pseudonymisierte Identifier verwenden. (Minimiert Datenexposition in Drittsystemen.)
- **Pflicht:** Webhook-Handler müssen HMAC/Signatur validieren, bevor der Request-Body verarbeitet wird. (Verhindert gefälschte Requests.)
- **Pflicht:** Interne Systemdetails, Stack Traces, Hostnamen oder SQL-Fehlermeldungen niemals in nutzersichtbaren Fehlertexten weitergeben. (Verhindert Information Disclosure.)
- **Pflicht:** eval() und new Function() mit dynamischem oder nutzergesteuertem Input vollständig verbieten — JSON.parse() für Daten und AST-Transforms für Code verwenden. (Verhindert Code-Injection.)
- **Pflicht:** Passwörter mit bcrypt (Cost ≥ 12) oder Argon2 hashen, Tokens/Salts via CSPRNG (crypto.randomUUID/getRandomValues) erzeugen und keine eigene Kryptografie implementieren. (Schwache Hashes und Math.random sind angreifbar.)
- **Pflicht:** Nutzerkontrollierte URLs nie direkt an fetch/axios übergeben — vorher gegen eine strikte Allowlist validieren. (Verhindert SSRF.)
- **Pflicht:** Jeden analytics.track()-Aufruf und Session-Recording-Tools hinter separate Consent-Prüfungen kapseln — allgemeine Analytics-Einwilligung deckt Session-Recording nicht ab. (Verhindert unzulässiges Tracking.)
- **Pflicht:** Server-only-Code niemals in Client-Bundles importieren und Client-only-Code nicht serverseitig ausführen — geteilten Code in einem dedizierten Shared-Verzeichnis ablegen. (Verhindert Secret-Leaks und Bundle-Fehler.)
- **Pflicht:** Baseline-Security-Header (CSP, HSTS, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy) zentral konfigurieren und in allen Responses ausliefern. (Härtet Browser gegen gängige Angriffe.)
- **Pflicht:** Rate-Limiting für alle öffentlichen und auth-relevanten Endpunkte durchsetzen; Auth-Endpunkte am restriktivsten begrenzen. (Schützt vor Brute-Force und Abuse.)
- **Pflicht:** CORS nur für explizit aufgelistete Origins erlauben; niemals Wildcard (*) in Produktion verwenden. (Verhindert Cross-Origin-Datenabfluss.)
- **Pflicht:** Session-Cookies mit HttpOnly, Secure und SameSite=Lax/Strict konfigurieren und Tokens/JWTs/Session-IDs nie in localStorage speichern. (Schützt Tokens vor XSS-Diebstahl.)
- **Pflicht:** Row Level Security für jede Tabelle mit nutzerbezogenen Daten aktivieren und explizite Policies definieren, bevor die Tabelle produktiv genutzt wird. (Erzwingt Datenisolation auf DB-Ebene.)
- **Pflicht:** Nutzer-Identifier in Events ausschließlich über einen zentralen Pseudonymisierungsdienst ableiten — rohe Datenbank-IDs oder E-Mails sind verboten. (Verhindert Re-Identifikation.)
- **Pflicht:** Nutzereingaben nie per String-Interpolation in SQL-, NoSQL- oder Shell-Queries einbauen — ausschließlich parametrisierte Abfragen oder ORM-Methoden verwenden. (Verhindert Injection.)
- **Pflicht:** Bei Datenbank-Updates req.body nie direkt spreaden — nur explizit aufgelistete Felder per Destructuring übernehmen. (Verhindert Mass-Assignment.)
- Empfehlung: Container-Images und veröffentlichte Pakete kryptografisch signieren und mit Build-Provenance versehen (sigstore/cosign, npm provenance). (Sichert Artefakt-Integrität.)

## Pflege dieser Datei
- **Pflicht:** Diese Konventionsdatei aktuell halten, wenn sich Regeln ändern.
- Empfehlung: Bestehende Regeln nicht ohne Begründung entfernen.
- Empfehlung: Datei fokussiert halten — wächst sie zu stark, in Themen-Dateien aufteilen.
- Empfehlung: Abhängigkeiten regelmäßig aktualisieren und auf bekannte CVEs prüfen.
- Empfehlung: TODO/FIXME mit Kontext oder Ticket versehen — keine anonymen Marker liegen lassen.
- Empfehlung: Dokumentiere signifikante Architekturentscheidungen als ADR in docs/adr/ mit Was, Warum, Alternativen und Konsequenzen.
- Empfehlung: Dokumentiere jeden neuen öffentlichen Endpunkt mit einer OpenAPI/Swagger-Spezifikation und halte README sowie Tech-Stack-Angaben mit dem tatsächlichen Code synchron. (Aktuelle Dokumentation reduziert Onboarding- und Wartungsaufwand.)
- **Pflicht:** Vergib Versionsnummern strikt nach Semantic Versioning und versieh jede @deprecated-Annotation mit Migrationsziel-Version, Nachfolger und Link zum Migrationsleitfaden.
- **Pflicht:** Erfasse die vier Golden Signals (Traffic, Fehlerrate, Latenz p50/p95/p99, Kapazität) für alle produktiven Deployments in einem Dashboard und versieh jeden Alert mit Bedingung, Schwellenwert, Dauer und konkreter Response-Aktion. (Ohne Messbarkeit und definierte Reaktionen ist Betrieb nicht wartbar.)
- **Pflicht:** Dokumentiere einen Incident-Response-Prozess (Detect → Assess → Mitigate → Resolve → Document) mit versionierten Runbooks und prüfe DR-Runbooks samt RTO/RPO mindestens alle 90 Tage mit datiertem Testvermerk.
- **Pflicht:** Führe alle Infrastruktur- und Staging-Änderungen ausschließlich versioniert über genehmigte IaC-Tools (Terraform, Pulumi, CDK) durch — manuelle Cloud-Console-Änderungen in Produktion sind verboten.
- **Pflicht:** Halte die 3-2-1-Backup-Regel ein und konfiguriere Cross-Region-Replikation mit mindestens einer sekundären Region für alle produktiven Speicher.
- **Pflicht:** Aktiviere Point-in-Time Recovery (PITR) in der Datenbankinfrastruktur und führe regelmäßig einen Restore-Test durch.
- Empfehlung: Implementiere einen automatisierten Rollback-Mechanismus, teste ihn in Staging und stelle sicher, dass der gesamte Prozess unter 5 Minuten abschließt.
- Empfehlung: Pflege ein Scaling-Runbook mit priorisierten Bottlenecks, Schwellwerten und Skalierungsbefehlen und dokumentiere Load-Test-Ausführung in docs/load-testing.md.
- Empfehlung: Konfiguriere Budget-Alerts für Cloud- und LLM-Dienste mit Schwellenwerten bei 50%, 80% und 100% des Limits.
- Empfehlung: Dokumentiere Vendor-Lock-in-Risiken und Exit-Strategien mit Migrationsschritten, Daten-Export und Zeitschätzung unter docs/exit-strategies/.
- Empfehlung: Liefere jede öffentliche Komponente mit JSDoc-Beschreibung und zugehöriger Storybook-Story aus und benenne gleichartige UI-Aktionen konsistent über ein gepflegtes Glossary.
- Empfehlung: Dokumentiere neue Analytics-Events mit Zweck, Schema-Version und Business-Kontext in einem zentralen Event-Katalog.
- Empfehlung: Sichere teure oder häufig wiederholte KI-Aufrufe mit einem Cache (z. B. Redis, normalisierte Prompt-Keys, dokumentierter TTL) ab.
- Empfehlung: Pflege eine substantielle KI-Kontext-Datei (.cursorrules, CLAUDE.md o.ä.) mit mindestens 200 Zeichen und explizit angegebenem Tech-Stack.