# Findings-Inventar 2026-05-05

> **Anlass:** Vorbereitung ADR-027 Schritt 8 (Coach-Wording-Implementation)
> **Methode:** Analyse von `rule-registry.ts`, `finding-recommendations.ts`, `security-scan-checker.ts`
> **Stand:** 242+ Rules, 25 Kategorien, 6 aktive Audit-Domänen

---

## Zusammenfassung

| Status | Anzahl | Anteil |
|--------|--------|--------|
| **A — Coach-Sprache ✅** | ~45 | ~19% |
| **B — Halb-Coach** | ~80 | ~33% |
| **C — Compliance-Sprech ❌** | ~60 | ~25% |
| **D — Generisch / Extern** | ~57 | ~24% |
| **Gesamt** | 242 | 100% |

**Kernbefund:** Nur ~19% der Rules haben vollständig Coach-Sprache. Die größten Wording-Defizite sind bei DSGVO/KI-Act-spezifischen Rules (DSGVO-Präfix, BFSG-Präfix, Art.-X-Referenzen) und bei extern generierten Findings (Lighthouse, npm-audit, ESLint).

**Positive Ausnahme:** Security-Killer-Rules haben bereits gutes Coach-Wording (aus dem Komitee-Sprint 2026-05-04). Diese müssen in Sprint 8 nicht überarbeitet werden.

---

## Pro Domäne

### Security (Universal-Killer — bereits gutes Wording)

| Rule-ID | Titel (aktuell) | Status | Sprint-8-Prio |
|---------|-----------------|--------|---------------|
| cat-3-rule-20 | Keine Injection-Patterns (SQL/Cmd/Path) | B | niedrig |
| cat-3-rule-21 | Keine unsicheren Auth-Pattern (Secrets/Tokens) | B | niedrig |
| cat-3-rule-build | Production-Build erfolgreich | A ✅ | — |
| config-killer-db-ssl | DB-Verbindungen nutzen SSL | A ✅ | — |
| config-killer-dev-secret | Keine Dev-Credentials in Production | A ✅ | — |
| config-killer-https | HTTPS-Erzwingung vorhanden | A ✅ | — |
| cat-3-rule-18 | CORS: keine Wildcard-Origin | B | niedrig |
| cat-3-rule-15 | Auth-Check in allen API-Routes | B | niedrig |

*Coach-Wording für alle 8 Killer-Rules bereits aus Komitee-Sprint 2026-05-04 vorhanden. In Sprint 8 nur UI-Integration, kein neues Wording nötig.*

---

### DSGVO (Category 4 — größter Wording-Deficit)

| Rule-ID | Titel (aktuell) | Status | Vibe-Coder-Problem | Sprint-8-Prio |
|---------|-----------------|--------|--------------------|---------------|
| cat-4-rule-7 | Impressum + Datenschutz-Seiten vorhanden | B | "Impressum" klar, aber Kontext fehlt | **hoch** |
| cat-4-rule-12 | **DSGVO: Cookie Consent Library** | C ❌ | "DSGVO: Library" = Fachjargon | **hoch** |
| cat-4-rule-13 | **DSGVO: Kein Tracking vor Consent (Art. 7)** | C ❌ | "Art. 7" = Compliance-Sprech | **hoch** |
| cat-4-rule-14 | **DSGVO: Passwort-Hashing (Art. 32)** | C ❌ | "Art. 32" = Anwalts-Sprache | **hoch** |
| cat-4-rule-15 | **DSGVO: HSTS-Header konfiguriert** | C ❌ | HSTS = Tech-Jargon + DSGVO-Präfix | **mittel** |
| cat-4-rule-16 | **DSGVO: CSP-Header konfiguriert** | C ❌ | CSP = Tech-Jargon + DSGVO-Präfix | **mittel** |
| cat-4-rule-17 | **DSGVO: Datenexport-Endpunkt (Art. 20)** | C ❌ | "Art. 20" + Endpunkt | **mittel** |
| cat-4-rule-18 | **DSGVO: Account-Löschung (Art. 17)** | C ❌ | "Art. 17" = Anwalts-Sprache | **hoch** |
| cat-4-rule-20 | AGB/Terms-Seite vorhanden | B | "AGB" klar, Kontext fehlt | **mittel** |
| cat-4-rule-21 | Widerrufsbelehrung vorhanden | C ❌ | "Widerrufsbelehrung" unbekannt | **hoch** |
| cat-4-rule-22 | Checkout-Button: "Kostenpflichtig bestellen" | B | Technisch klar, Kontext fehlt | **niedrig** |
| cat-4-rule-8 | VVT (Verarbeitungsverzeichnis) in docs/ | C ❌ | VVT = reiner Compliance-Begriff | **mittel** |
| cat-4-rule-10 | PII in Analytics-Events getrennt | C ❌ | "PII" = Fachbegriff | **mittel** |
| cat-4-rule-1 | Kein PII in Logs | C ❌ | "PII" = Fachbegriff | **hoch** |

**Wording-Beispiele (C → Vorschlag für A):**
- "DSGVO: Cookie Consent Library" → "Haben Nutzer die Möglichkeit, Cookies abzulehnen, bevor sie gesetzt werden?"
- "DSGVO: Account-Löschung (Art. 17)" → "Können Nutzer ihren Account vollständig löschen lassen?"
- "Widerrufsbelehrung vorhanden" → "Können Käufer Bestellungen innerhalb von 14 Tagen stornieren?"
- "Kein PII in Logs" → "Werden keine Namen, E-Mails oder andere Nutzerdaten in Logs gespeichert?"

---

### KI-Act (Category 22 — zweithöchster Wording-Deficit)

| Rule-ID | Titel (aktuell) | Status | Vibe-Coder-Problem | Sprint-8-Prio |
|---------|-----------------|--------|--------------------|---------------|
| cat-22-rule-1 | Prompt Injection Defense | C ❌ | "Defense" = Tech-Jargon | **hoch** |
| cat-22-rule-5 | User-Input nicht in System-Prompt | B | Klar für Entwickler, unklar für Vibe-Coder | **mittel** |
| cat-22-rule-8 | **Kein AI-Security-Risk (Prompt-Injection/Output-Eval)** | C ❌ | "Output-Eval" unbekannt | **hoch** |
| cat-22-rule-9 | **AI Act: Risikoeinstufung dokumentiert** | C ❌ | "AI Act: Risikoeinstufung" = Compliance-Sprache | **hoch** |
| cat-22-rule-10 | **AI Act: KI-Interaktionen erkennbar** | B | "AI Act" Präfix + klar | **mittel** |
| cat-22-rule-11 | **AI Act: KI-Entscheidungs-Logging** | B | "Logging" klar, Kontext fehlt | **mittel** |
| cat-22-rule-12 | **AI Act: Zweckbeschreibung dokumentiert** | B | "Zweckbeschreibung" formal | **mittel** |
| cat-22-rule-13 | **AI Act: Keine verbotenen Praktiken** | C ❌ | "Verbotene Praktiken" — was ist das? | **hoch** |
| cat-22-rule-14 | **AI Act: KI-Nutzung transparent kommuniziert** | B | Halbwegs klar | **mittel** |
| cat-22-rule-15 | **AI Act: KI-generierte Inhalte markiert** | B | Relativ klar | **niedrig** |

**Wording-Beispiele (C → Vorschlag für A):**
- "AI Act: Risikoeinstufung dokumentiert" → "Wisst ihr, welche Risikokategorie eure KI laut EU AI Act hat?"
- "AI Act: Keine verbotenen Praktiken" → "Nutzt eure KI keine verbotenen Methoden wie Social Scoring oder unterschwellige Manipulation?"
- "Kein AI-Security-Risk (Prompt-Injection)" → "Können User durch ihre Eingaben eure KI umprogrammieren?"

---

### Accessibility / Barrierefreiheit (Category 16 — mittlerer Deficit)

| Rule-ID | Titel (aktuell) | Status | Vibe-Coder-Problem | Sprint-8-Prio |
|---------|-----------------|--------|--------------------|---------------|
| cat-16-rule-1 | WCAG 2.1 AA Konformität (Lighthouse) | C ❌ | "WCAG 2.1 AA" = Standard-Jargon | **hoch** |
| cat-16-rule-3 | Korrekte ARIA-Nutzung | B | ARIA bekannt bei Devs, Vibe-Coder? | **mittel** |
| cat-16-rule-5 | **BFSG: Erklärung zur Barrierefreiheit vorhanden** | C ❌ | "BFSG" unbekannt + formale Sprache | **hoch** |
| cat-16-rule-6 | **BFSG: Feedback-Mechanismus in Erklärung** | C ❌ | "Feedback-Mechanismus" formell | **mittel** |
| cat-16-rule-7 | **BFSG: HTML lang-Attribut gesetzt** | B | Technisch klar, Kontext fehlt | **niedrig** |
| cat-16-rule-8 | **BFSG: Skip-Navigation-Link vorhanden** | C ❌ | "Skip-Navigation" = Tech-Jargon | **mittel** |
| cat-16-rule-9 | **BFSG: ARIA live-Regions für dynamische Inhalte** | C ❌ | ARIA + live-Regions = tiefer Tech-Jargon | **mittel** |
| cat-16-rule-10 | Accessibility: `<img>` mit alt-Text | A ✅ | Klar und bekannt | — |

**Wording-Beispiele (C → Vorschlag für A):**
- "WCAG 2.1 AA Konformität" → "Können blinde Menschen eure App mit einem Screenreader benutzen?"
- "BFSG: Erklärung zur Barrierefreiheit" → "Gibt es auf eurer Webseite eine Seite, die erklärt, wie barrierefrei eure App ist?"
- "BFSG: ARIA live-Regions" → "Wenn sich Inhalte dynamisch ändern — werden Screenreader-Nutzer davon benachrichtigt?"

---

### Performance (Extern/Lighthouse — Wording-Limitation)

| Rule-ID | Titel (aktuell) | Status | Sprint-8-Prio |
|---------|-----------------|--------|---------------|
| cat-7-rule-1 | Core Web Vitals im Zielbereich | C ❌ | **hoch** |
| cat-7-rule-2 | Bundle-Größe analysiert und optimiert | B | **mittel** |
| cat-7-rule-6 | Pagination in GET-Endpunkten erkennbar | B | **niedrig** |
| cat-7-rule-7 | Performance-Basics (lazy images, next/image) | B | **niedrig** |
| cat-2-rule-11 | Lighthouse Best Practices | D | **kein Sprint-8-Aufwand** |

**Wording-Beispiele:**
- "Core Web Vitals im Zielbereich" → "Lädt eure App schnell genug, dass Nutzer nicht abspringen? (Google misst das.)"
- "Bundle-Größe analysiert" → "Ist eure App-Datei so groß, dass die Ladezeit leidet?"

---

### Code-Qualität (Universal — gemischter Status)

**Status-Übersicht (Category 1, 2, 5, 6, 9, 10, 11, 12, 14, 15, 17, 18, 19, 20, 21, 23, 24, 25):**

| Status | Typische Beispiele |
|--------|--------------------|
| A ✅ | "Production-Build erfolgreich", "ESLint konfiguriert", "Lockfiles committed" |
| B | "Keine leeren catch-Blöcke", "Keine N+1 Queries", "Keine Magic Numbers" |
| C ❌ | "VVT (Verarbeitungsverzeichnis)", "SBOM generiert und gepflegt", "Distributed Tracing (OpenTelemetry)" |
| D | ESLint-Warnings, npm-audit-Findings, Lighthouse-Metriken |

**Top-5 Code-Qualität Wording-Defizite:**
1. `cat-12-rule-4` — "Distributed Tracing (OpenTelemetry)" → "Können ihr nachvollziehen, welche Anfrage wohin läuft?"
2. `cat-24-rule-1` — "SBOM generiert und gepflegt" (Enterprise) → "Wisst ihr genau, welche Bibliotheken in eurem Build stecken?"
3. `cat-13-rule-1` — "3-2-1-Backup-Regel umgesetzt" → "Habt ihr Backups, die auch bei einem Totalausfall noch da sind?"
4. `cat-10-rule-1` — "Unit-Test-Coverage >= 80%" → A (Metric-Sprache ist akzeptabel hier)
5. `cat-20-rule-1` — "Cloud-Budget-Alerts konfiguriert" → B (fast A, nur Kontext fehlt)

---

## Domänen ohne Detektoren (heute)

| Domäne (ADR-027) | Status | Schritt |
|-----------------|--------|---------|
| Open-Source-Lizenzen | Keine Detektoren → keine Findings | Schritt 9 |
| Marketing/Werbung | Keine Detektoren → keine Findings | Schritt 9 |
| Branchen-Sensibilität (Health/Finance) | Nur manuelle Checks → keine Auto-Findings | Schritt 9 |
| Plattform (App Store) | Nur manifest.json-Check | Schritt 9 |
| Infrastruktur (Hosting-Region) | config-killer-* abgedeckt, Rest fehlt | Schritt 9 |

**Konsequenz für Sprint 8:** Wording-Sprint kann nur Rules mit existierenden Detektoren behandeln. Schritt 9 bringt neue Rules + dann brauchen diese auch Coach-Wording.

---

## Generische / Externe Findings (Status D — eigenes Kapitel)

Diese Findings kommen von externen Tools. Coach-Wording muss Tropen OS selbst formulieren, da externe Tools keine Vibe-Coder-Sprache haben.

| Quelle | Anzahl | Beispiel-Finding | Wording-Aufwand |
|--------|--------|-----------------|-----------------|
| Lighthouse (Performance) | ~20 | "Largest Contentful Paint" | **hoch** — LCP = unbekannt |
| Lighthouse (Accessibility) | ~15 | "Color contrast ratio" | **mittel** |
| npm-audit | variabel | "CVSS 7.4: vulnerable dependency" | **hoch** — CVSS unbekannt |
| ESLint | ~30 | "no-unused-vars warning" | **niedrig** — Developer-verständlich |

**Empfehlung:** Lighthouse + npm-audit haben eigene Wrapper-Wording-Templates (heute in `finding-recommendations.ts`). Diese müssen in Sprint 8 überprüft und angepasst werden.

---

## Sprint-8-Empfehlung

### Priorisierungs-Matrix

| Prio | Domäne | Anzahl Rules | Aufwand | Komitee? |
|------|--------|-------------|---------|----------|
| **1. DSGVO** | cat-4 | 14 | ~4h | empfohlen |
| **2. KI-Act** | cat-22 | 10 | ~3h | empfohlen |
| **3. BFSG/Accessibility** | cat-16 | 8 | ~2h | optional |
| **4. Performance** | cat-7 | 5 | ~1h | nicht nötig |
| **5. Code-Qualität (Top 5)** | diverse | 5 | ~1h | nicht nötig |
| **6. Lighthouse-Wrapper** | D | ~20 | ~2h | optional |
| **7. npm-audit-Wrapper** | D | variabel | ~1h | nicht nötig |

### Empfehlung Sprint-Aufteilung

**Sprint 8a — DSGVO + KI-Act Wording (mit Komitee):**
- ~24 Rules mit A/B/C-Klassifikation überarbeiten
- Komitee-Review wegen rechtlicher Sensitivität
- Kosten-Schätzung: ~€2–4 Komitee + ~5h Implementation
- Output: 24 überarbeitete Titel + problem-Felder in `finding-recommendations.ts`

**Sprint 8b — Rest ohne Komitee:**
- BFSG/Accessibility (8 Rules), Performance (5 Rules), Top-5 Code-Qualität
- ~3h reine Implementation
- Kein Komitee nötig (keine rechtliche Sensitivität)

**Nicht in Sprint 8:**
- Externe Tool-Wording (Lighthouse, npm-audit) → komplexer, separater Sprint
- Open-Source-Lizenzen / Marketing → warten auf Schritt 9 Detektoren

### Gesamt-Aufwand-Schätzung

| Schritt | Aufwand |
|---------|---------|
| Komitee-Sprint (DSGVO + KI-Act) | ~€3 + 1h Review |
| Implementation Sprint 8a | ~5h |
| Implementation Sprint 8b | ~3h |
| **Total** | **~9h + €3 Komitee** |

---

## Kritische Beobachtungen

1. **Der DSGVO-Präfix-Effekt:** 12 von 14 DSGVO-Rules beginnen mit "DSGVO:" — dieser Präfix signalisiert sofort Compliance-Sprache. In Sprint 8 komplett entfernen, ersetzen durch beschreibende Fragen.

2. **Art.-X-Referenzen in Titeln:** 5 Rules haben direkte Artikel-Referenzen (Art. 7, Art. 17, Art. 20, Art. 32). Diese gehören in die `hint`-Felder, nicht in Titel.

3. **Killer-Rules sind bereits Coach-ready:** Die 8 Killer-Rules haben aus dem Komitee-Sprint 2026-05-04 bereits gutes Wording. Diese werden in Sprint 8 nur UI-seitig eingebunden, kein neues Wording nötig.

4. **finding-recommendations.ts ist die richtige Architektur:** Wording ist bereits zentralisiert. Sprint 8 überarbeitet bestehende Einträge und ergänzt fehlende. Kein Architektur-Refactor nötig.

5. **Manuelle Rules (64 Stück) brauchen kein Sprint-8-Wording:** Manuelle Findings werden vom User ohnehin selbst beurteilt. Coach-Wording für Manuelle ist nice-to-have, kein Sprint-8-Muss.
