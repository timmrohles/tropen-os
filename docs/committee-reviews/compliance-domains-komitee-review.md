# Committee Review: compliance-domains-komitee

> Generiert am 2026-05-05 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Technischer Architektur-Konsens Report: Compliance-Domänen

## Zusammenfassung der Bewertung
4 KI-Modelle haben die Compliance-Domänen-Architektur für Tropen OS bewertet. Mehrheitlich besteht Einigkeit über die Kern-Domänen, jedoch gibt es bedeutende Spaltungen bei der Granularität und Implementierungs-Strategie.

---

## FRAGE 1 — Vollständigkeit der Domänen-Liste

**Konsens-Level:** MEHRHEIT

### Endgültige Empfehlung: 9 Domänen (8 Original + 1 Neue)

#### Finale Domänen-Liste mit Stufen:

1. **Datenschutz** — Stufe 1 (Code-Detection) + Stufe 2 (KI-Inhalt)
2. **KI-Einsatz** — Stufe 1 (API-Detection) + Stufe 2 (Transparenz)
3. **E-Commerce** — Stufe 1 (Payment-APIs) + Stufe 3 (AGB)
4. **Branchen-Sensibilität** — Stufe 1 (API-Patterns) + Stufe 3 (Zertifikate)
5. **Barrierefreiheit** — Stufe 1 (WCAG-Checks) + Stufe 2 (UI-Analyse)
6. **Werbung/Marketing** — Stufe 1 (Tracking-Detection) + Stufe 3 (Influencer)
7. **Plattform-Compliance** — Stufe 1 (Manifest) + Stufe 2 (Content)
8. **Infrastruktur-Compliance** — Stufe 1 (Config-Scans)
9. **Open-Source-Lizenzen** (NEU) — Stufe 1 (Dependency-Scan)

### Spaltungs-Argumente:

**CLAUDE/GROK-Lager:** Domäne 8 (Infrastruktur) mit Domäne 1 (Datenschutz) verschmelzen
- Claude: "zu technisch = gehört zu Datenschutz"
- Grok: Behalten aber universal wie Cybersecurity behandeln

**GPT-4O Sondermeinung:** Export-Kontrolle als 10. Domäne
- Andere Modelle: Zu speziell für Vibe-Coder-Zielgruppe

### Lücken-Domänen mit Priorität:

1. **Open-Source-Lizenzen** (EINIG) — **Priorität: Sofort**
   - Begründung: "GPL-Violations = echte rechtliche Risiken" (Claude)
   - Aktivierung: Alle Profile außer Demo

2. **Arbeitsrecht/HR-Tools** (GESPALTEN) — **Priorität: Später**
   - Nur Claude erwähnt, andere schweigen
   - Begründung: Betriebsrat-Pflichten bei HR-SaaS

3. **Export-Kontrolle** (GESPALTEN) — **Priorität: Nie**
   - Nur GPT-4O erwähnt
   - Zu abstrakt für automatische Prüfung

---

## FRAGE 2 — Kontext-Fragen-Präzision

**Konsens-Level:** EINIG

### Endgültige Empfehlung: Präzisierung und Deduplizierung

#### Domänen-übergreifende geteilte Fragen:

1. **"Geo-Scope: EU/Nicht-EU?"** — Einmal fragen, nutzen für:
   - Domäne 1 (DSGVO-Aktivierung)
   - Domäne 2 (AI Act)
   - Domäne 3 (Verbraucherrecht)
   - Domäne 5 (BFSG)

2. **"User-Daten gesammelt?"** — Einmal fragen, nutzen für:
   - Domäne 1 (Datenschutz-Level)
   - Domäne 2 (KI-Training)
   - Domäne 6 (Tracking-Consent)

#### Top-3 Vibe-Coder-Verständnis-Fallen:

1. **"Sensible Daten"** — Vibe-Coder denken an Passwörter, nicht Art. 9 DSGVO
   - Besser: "Gesundheit, Religion, Politik, sexuelle Orientierung?" (Claude)

2. **"Biometrie"** — Vibe-Coder denken an Face-ID, nicht Sentiment-Analyse
   - Besser: "Gesichtserkennung oder Emotionsanalyse?" (Claude)

3. **"Tracking"** — Unterscheidet nicht zwischen notwendig vs. Marketing
   - Besser: Aufsplitten in "Analytics (GA4)" / "Ads (FB Pixel)" / "Errors (Sentry)" (Claude)

#### Präzisierungs-Bedarf:

- **Domäne 1:** "Drittland-Transfers?" ergänzen (Schrems-II-Problem)
- **Domäne 2:** "Training mit User-Daten?" (OpenAI-Default-Problem)
- **Domäne 3:** "Automatische Abo-Verlängerung?" (Widerruf-Sonderfall)

---

## FRAGE 3 — Pflicht vs Optional fürs Onboarding

**Konsens-Level:** MEHRHEIT

### Endgültige Empfehlung:

| Domäne | Status | Begründung | Default bei Skip |
|--------|---------|------------|------------------|
| **Profil-Wahl** | PFLICHT | Basis für alle anderen Aktivierungen | — |
| **Geo-Scope** | PFLICHT | EU/Nicht-EU fundamental | — |
| **Datenschutz** | PFLICHT | "Kern-Compliance, größte Risiken" (Claude) | — |
| **KI-Einsatz** | EMPFOHLEN | Zunehmend kritisch, aber nicht universal | Nein |
| **E-Commerce** | EMPFOHLEN | Häufig, aber nicht universal | Nein |
| **Marketing** | LAZY | Code-Detection für GA4/Pixel | GA4 assumed |
| **Branchen** | SETTINGS | Zu spezifisch fürs Onboarding | Keine |
| **Barrierefreiheit** | SETTINGS | BFSG-Details nur wenn aktiviert | Inaktiv |
| **Plattform** | LAZY | Triggert durch capacitor.config | Inaktiv |
| **Infrastruktur** | LAZY | Auto-detect Hosting-Provider | Vercel |
| **Open-Source** | LAZY | package.json GPL-Scan | MIT assumed |

### Spaltungs-Argumente:

**GPT-4O:** E-Commerce als PFLICHT (nicht nur EMPFOHLEN)
- Andere: Zu viel Reibung im Onboarding

---

## FRAGE 4 — Profile Update

**Konsens-Level:** GESPALTEN

### Endgültige Empfehlung: 5 Profile beibehalten mit Anpassungen

#### Profile-Bewertung:

1. **Demo-Projekt** → **Solo-Projekt** (umbenennen)
   - Beschreibung: "Keine User-Daten, kein Internet" (GPT-4O präziser)

2. **Interne Tools** → **Behalten**
   - Mehrheit: Sinnvolle Abstufung

3. **Public App (ohne Login)** → **Public App (ohne PII)**
   - Klarere Abgrenzung zu Profil 4

4. **B2C mit User-Daten** → **Behalten**
   - Kern-Use-Case für Vibe-Coder

5. **B2B Enterprise** → **Regulierte B2B App**
   - Betonung auf Compliance statt Größe

### Default-Werte-Tabelle:

| Profil | Datenschutz | KI | Commerce | Branchen | A11y | Marketing | Platform | Infra | OSS |
|--------|-------------|-----|----------|----------|------|-----------|----------|-------|-----|
| Solo | — | — | — | — | — | — | — | — | LAZY |
| Intern | AKTIV | — | — | LAZY | — | — | — | AKTIV | LAZY |
| Public | — | LAZY | LAZY | — | AKTIV | LAZY | AKTIV | AKTIV | LAZY |
| B2C | AKTIV | LAZY | AKTIV | LAZY | AKTIV | AKTIV | AKTIV | AKTIV | LAZY |
| B2B | AKTIV | AKTIV | AKTIV | AKTIV | AKTIV | LAZY | AKTIV | AKTIV | AKTIV |

### Spaltungs-Argumente:

**CLAUDE:** Domänen als Sub-Profile innerhalb der 5 Haupt-Profile
**GPT-4O/GEMINI:** Separate Domänen-Aktivierung nach Profil-Wahl
**GROK:** Progressive Disclosure wichtiger als Granularität

---

## Spaltungen für Timm's Entscheidung (Priorisiert)

1. **Domäne 8 verschmelzen oder separat?**
   - Pro Merge: Reduziert Komplexität, technisch gehört zu Datenschutz
   - Pro Separat: Klarere Verantwortlichkeiten, andere Compliance-Officer

2. **3 vs 5 Onboarding-Pflichtfragen?**
   - Minimal: Nur Profil + Geo + Datenschutz
   - Erweitert: + KI + E-Commerce für bessere Ersteinrichtung

3. **Open-Source als universale Domäne?**
   - Universal: Wie Cybersecurity, immer prüfen
   - Conditional: Nur bei erkannten Dependencies

4. **Vibe-Coder-Sprache radikal vereinfachen?**
   - Radikal: "Sammelt ihr Namen/Emails?" statt "PII-Processing"
   - Moderat: Fachbegriffe mit Tooltips

---

## Nächste Schritte

### Empfehlungen für Folgesprint (Top 5):

1. **Stufe-1-Scanner prototypen** (1 Woche)
   - Focus: Datenschutz + Open-Source Detection
   - Stack: AST-Parser für Next.js/TypeScript

2. **Onboarding-Flow A/B-Test** (2 Wochen)
   - Variante A: 3 Pflichtfragen
   - Variante B: 5 Fragen mit Skip-Option
   - Metrik: Completion-Rate

3. **Vibe-Coder-Wörterbuch** (3 Tage)
   - 20 Rechtsbegriffe → Alltagssprache
   - Mit echten Gründern validieren

4. **KI-Transparenz-Templates** (1 Woche)
   - AI Act Art. 50 konforme Textbausteine
   - Für OpenAI/Anthropic/Gemini APIs

5. **Domänen-Interdependenz-Matrix** (3 Tage)
   - Welche Domänen triggern andere?
   - Reduktion von Redundanz

---

## Kosten-Warnung

⚠️ **Komplexität höher als erwartet:**

Die Verschränkung von Profilen × Domänen × Stufen erzeugt eine 5×9×3 = 135-Zellen-Matrix. 

**Empfehlung:** Start mit 3 Profilen × 5 Kern-Domänen × Stufe 1 only = 15 Zellen für MVP. Schrittweise Erweiterung basierend auf Usage-Analytics.

**Entwicklungs-Aufwand:** 
- MVP (15 Zellen): 4 Wochen
- Full-Matrix (135 Zellen): 6+ Monate

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    6779 |    2048 | €0.0475 |
| GPT-4o           |    4844 |    1333 | €0.0237 |
| Gemini 2.5 Pro   |    5220 |    2044 | €0.0251 |
| Grok 4           |    5851 |    2541 | €0.0518 |
| Judge (Opus)     |    7651 |    3178 | €0.3284 |
| **Gesamt**       |         |         | **€0.4764** |
