# Compliance-Domänen-Komitee 2026-05-05

> **Datum:** 2026-05-05
> **Anlass:** Compliance-Architektur-Pivot — multi-dimensionale Achsen statt nur 5 Profile
> **Methode:** Multi-Model-Komitee (Claude Sonnet + GPT-4o + Gemini 2.5 Pro + Grok 4 + Opus-Judge)
> **Kosten:** €0.48
> **Vollständiger Rohbericht:** `docs/committee-reviews/compliance-domains-komitee-review.md`

---

## Frage 1 — Vollständigkeit der Domänen-Liste

**Konsens-Level:** MEHRHEIT

### Finale Domänen-Liste: 9 Domänen

| # | Domäne | Stufe heute | Stufe später | Entscheidung |
|---|--------|-------------|--------------|--------------|
| 1 | Datenschutz | Code-Detection (DSGVO, CCPA) | KI-gestützte Inhalts-Prüfung | Bleibt |
| 2 | KI-Einsatz | API-Detection (Anthropic/OpenAI) | Transparenz-Prüfung | Bleibt |
| 3 | E-Commerce | Payment-APIs (Stripe-Detection) | — | AGB nur Stufe 3 |
| 4 | Branchen-Sensibilität | API-Patterns (Health-Keywords) | — | Zertifikate Stufe 3 |
| 5 | Barrierefreiheit | WCAG-Code-Checks | KI-UI-Analyse | Bleibt |
| 6 | Werbung/Marketing | Tracking-Script-Detection | — | Influencer Stufe 3 |
| 7 | Plattform (App Store) | Manifest-Detection | Content-Policy | Bleibt |
| 8 | Infrastruktur | Config-Scans, Hosting-Detection | — | Bleibt (Spaltung: Merge mit Dom1) |
| 9 | Open-Source-Lizenzen | Dependency-Scan (GPL-Detection) | — | **NEU — EINIG** |

### Gestrichene Kandidaten

- **Arbeitsrecht/HR-Tools** → Priorität: Später (nur Claude erwähnt, zu spezifisch)
- **Export-Kontrolle** → Nie (zu abstrakt für automatische Prüfung, nur GPT-4o)
- **Patentrecht/Markenrecht** → Stufe 3 (juristisch, kein Code-Check möglich)

### Spaltung 1 — Domäne 8 separat oder in Datenschutz verschmelzen?

- **Claude/Grok:** Verschmelzen (technisch gehört zu Datenschutz: Hosting-Region = DSGVO-Relevanz)
- **GPT-4o/Gemini:** Separat behalten (andere Compliance-Officer, klare Verantwortlichkeit)
- → **Timm entscheidet**

---

## Frage 2 — Kontext-Fragen-Präzision

**Konsens-Level:** EINIG

### Domänen-übergreifend geteilte Fragen (einmal fragen, mehrfach nutzen)

| Frage | Nutzt wird in |
|-------|--------------|
| "Geo-Scope: EU / Nicht-EU / Global / Egal?" | Datenschutz, KI, E-Commerce, Barrierefreiheit |
| "Werden User-Daten gesammelt?" | Datenschutz-Level, KI-Training, Tracking-Consent |
| "Business-Modell? B2C / B2B / Intern" | Barrierefreiheit (BFSG-Ausnahme), E-Commerce |

### Top-3 Vibe-Coder-Verständnis-Fallen

1. **"Sensible Daten"** — Vibe-Coder denken an Passwörter, nicht Art. 9 DSGVO
   - Besser: "Verarbeitest du Gesundheit, Religion, Politik oder sexuelle Orientierung?"

2. **"Biometrie"** — Vibe-Coder denken an Face-ID, nicht Sentiment-Analyse
   - Besser: "Gesichtserkennung oder Emotionsanalyse?"

3. **"Tracking"** — Unterscheidet nicht zwischen notwendig vs. Marketing
   - Besser: Aufsplitten in "Analytics (GA4)" / "Ads (FB Pixel)" / "Error-Monitoring (Sentry)"

### Präzisierungs-Bedarf pro Domäne

- **Datenschutz:** "Drittland-Transfers?" ergänzen (Schrems-II — USA-Server = Problem)
- **KI-Einsatz:** "Training mit User-Daten?" (OpenAI-Default trainiert auf Daten)
- **E-Commerce:** "Automatische Abo-Verlängerung?" (Widerruf-Sonderfall §312g BGB)

---

## Frage 3 — Pflicht vs Optional fürs Onboarding

**Konsens-Level:** MEHRHEIT

### Empfohlene Stufung

| Domäne / Frage | Status | Begründung | Default bei Skip |
|----------------|--------|------------|-----------------|
| **Profil-Wahl** (5 Profile) | PFLICHT | Basis für alle anderen Aktivierungen | — |
| **Geo-Scope** (EU/Nicht-EU) | PFLICHT | DSGVO/AI Act/BFSG alle davon abhängig | — |
| **Datenschutz** (User-Daten?) | PFLICHT | Größte Risiken, höchste Bußgelder | — |
| **KI-Einsatz** | EMPFOHLEN | Zunehmend kritisch, nicht universal | Nein (keine KI) |
| **E-Commerce** | EMPFOHLEN | Häufig, aber nicht bei jeder App | Nein (kein Verkauf) |
| **Werbung/Marketing** | LAZY | Code-Detection: GA4/FB Pixel im Bundle? | GA4 assumed |
| **Branchen-Sensibilität** | SETTINGS | Zu spezifisch, Onboarding-Blocker | Keine Branche |
| **Barrierefreiheit** | SETTINGS | BFSG-Details erst nach Profil-Klärung | Inaktiv |
| **Plattform (App Store)** | LAZY | Triggert durch capacitor.config/Info.plist | Inaktiv |
| **Infrastruktur** | LAZY | Auto-detect Hosting (vercel.json, netlify.toml) | Vercel |
| **Open-Source-Lizenzen** | LAZY | package.json GPL-Scan automatisch | MIT assumed |

### Spaltung 2 — Minimal (3 Pflicht) vs. Erweitert (5 Pflicht)?

- **Minimal:** Nur Profil + Geo + Datenschutz = 3 Fragen
- **Erweitert (GPT-4o):** + KI + E-Commerce = 5 Fragen für bessere Ersteinrichtung, weniger False Negatives
- → **Timm entscheidet** (Onboarding-Reibung vs. Daten-Qualität abwägen)

---

## Frage 4 — Profile Update-Vorschlag

**Konsens-Level:** GESPALTEN

### Bewertung der 5 bestehenden Profile

5 Profile werden von allen Modellen als sinnvolle Anzahl bestätigt. Anpassungen:

| Alt | Neu | Änderung |
|-----|-----|---------|
| Demo / Solo-Tool | **Solo-Projekt** | Umbenannt — klarer was "Demo" bedeutet |
| Internes Tool | **Internes Tool** | Unverändert |
| Public Tool ohne PII | **Public App ohne Login** | Klarer: kein Login = kein PII |
| B2C-App mit User-Daten | **B2C-App mit Accounts** | "Accounts" griffiger als "User-Daten" |
| B2B / Reguliert | **Regulierte B2B-App** | Betonung Compliance statt Größe |

### Default-Werte-Tabelle: Profil × Domäne

| Profil | Datenschutz | KI | Commerce | Branche | A11y | Marketing | Platform | Infra | OSS |
|--------|------------|-----|----------|---------|------|-----------|----------|-------|-----|
| Solo-Projekt | — | — | — | — | — | — | — | — | LAZY |
| Internes Tool | AKTIV | — | — | LAZY | — | — | — | AKTIV | LAZY |
| Public App | — | LAZY | LAZY | — | AKTIV | LAZY | AKTIV | AKTIV | LAZY |
| B2C-App | AKTIV | LAZY | AKTIV | LAZY | AKTIV | AKTIV | AKTIV | AKTIV | LAZY |
| Regulierte B2B | AKTIV | AKTIV | AKTIV | AKTIV | AKTIV | LAZY | AKTIV | AKTIV | AKTIV |

AKTIV = beim First-Run aktiv · LAZY = nur wenn Code-Detection triggert · — = N/A (nicht relevant für dieses Profil)

### Spaltung 3 — Domänen als Sub-Profile oder separate Aktivierung?

- **Claude:** Domänen als Einstellungen innerhalb der 5 Haupt-Profile
- **GPT-4o/Gemini:** Separate Domänen-Aktivierung nach Profil-Wahl (mehr Flexibilität)
- **Grok:** Progressive Disclosure wichtiger als Granularität — Profil zuerst, dann verfeinern
- → **Timm entscheidet**

---

## Spaltungen — Timm-Entscheidung nötig

1. **Domäne 8 (Infrastruktur) verschmelzen oder separat?**
   - Pro Merge: Reduziert Komplexität, technisch gehört zu Datenschutz
   - Pro Separat: Klarere Verantwortlichkeiten, andere Compliance-Perspektive

2. **Onboarding: 3 Pflichtfragen oder 5?**
   - 3 (minimal): Profil + Geo + Datenschutz — wenig Reibung
   - 5 (erweitert): + KI + E-Commerce — bessere Datenbasis, weniger False Negatives

3. **Open-Source als universale Domäne (wie Cybersecurity)?**
   - Universal: Immer prüfen, alle Profile
   - Conditional: Nur bei erkannten GPL-Dependencies im package.json

4. **Vibe-Coder-Sprache radikal oder moderat vereinfachen?**
   - Radikal: "Sammelt ihr Namen/Emails?" statt "Verarbeitung personenbezogener Daten"
   - Moderat: Fachbegriffe mit Tooltips/Erklärungen

---

## Endgültige Empfehlungen (Opus-Judge)

### Für ADR-027 Update (Schritt 5)

- **Profil-Onboarding:** 3 Pflichtfragen + 2 empfohlene (Profil, Geo, Datenschutz, KI, Commerce)
- **Domänen-Anzahl:** 9 (8 Strawman + Open-Source-Lizenzen)
- **Profile:** 5 behalten, umbenennen (s.o.)
- **Progressive Disclosure:** LAZY-Domänen per Code-Detection aktivieren

### Kosten-Warnung (Opus-Empfehlung)

⚠️ Die Verschränkung von 5 Profilen × 9 Domänen × 3 Stufen erzeugt eine 135-Zellen-Matrix.

**Empfehlung MVP:** Start mit 3 Profilen × 5 Kern-Domänen × Stufe 1 only = 15 Zellen.
Schrittweise Erweiterung basierend auf Usage-Analytics.

**Entwicklungs-Aufwand:**
- MVP (15 Zellen): ~4 Wochen
- Full-Matrix (135 Zellen): 6+ Monate

---

## Empfehlungen für Folgesprint (Top 5)

1. **Stufe-1-Scanner für Datenschutz + Open-Source** (~1 Woche) — höchste Risiko-Abdeckung
2. **Vibe-Coder-Wörterbuch** (~3 Tage) — 20 Rechtsbegriffe in Alltagssprache übersetzen
3. **Onboarding-Flow bauen** mit 3 Pflichtfragen + LAZY-Detection (~2 Wochen)
4. **KI-Transparenz-Templates** für AI Act Art. 50 (~1 Woche) — Textbausteine pro Provider
5. **Domänen-Interdependenz-Matrix** (~3 Tage) — Welche Domänen triggern andere?
