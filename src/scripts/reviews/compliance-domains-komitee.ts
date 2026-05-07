import type { CommitteeReviewConfig } from '../committee-review'

// Strawman — 8 Compliance-Domänen mit Kontext-Fragen
// Vollständige Definition direkt im Prompt, da noch keine eigene Datei existiert.
const STRAWMAN = `
## Strawman — 8 Compliance-Domänen

### Domäne 1 — Datenschutz
Was abgedeckt: DSGVO (EU), CCPA (Kalif.), LGPD (Brasilien), DSG (CH), PIPL (China), UK GDPR
Kontext-Fragen:
1. User-Daten? Login-Daten | Profil-Daten | Aktivitätsdaten | Inhaltsdaten | Sensible Daten | Keine
2. User-Standort? EU/EWR | USA | UK | Schweiz | Andere | Global | weiß nicht
3. Server-Standort? EU | USA | Andere | Multi-Region

### Domäne 2 — KI-Einsatz
Was abgedeckt: EU AI Act (ab Aug 2026), Transparenzpflichten
Kontext-Fragen:
1. KI im Einsatz? Ja/Nein
2. Wenn Ja: LLM-Chatbot | Bildgenerierung | Empfehlungssysteme | Entscheidungssysteme | Biometrie | Sonstiges
3. User sehen KI-Inhalte direkt? Ja/Nein
4. KI trifft Entscheidungen über User? Ja/Nein — AI-Act-Hochrisiko-Trigger

### Domäne 3 — E-Commerce / Verkauf
Was abgedeckt: BGB-Widerruf, Impressum, Preisangaben, Plattform-zu-Plattform-VO
Kontext-Fragen:
1. App verkauft etwas? Ja/Nein
2. Was? Digitale Produkte | Physische Produkte | Abos | Marketplace | Sonstiges
3. Verkäufer-Sitz? EU | Nicht-EU
4. Kunden-Typ? B2C | B2B | Beide

### Domäne 4 — Branchen-Sensibilität
Was abgedeckt: HIPAA (Health), BaFin/MiFID (Finance), COPPA (Kinder), PDSG
Kontext-Fragen:
1. Branche? Gesundheit | Finanzen | Kinder/Jugend | Bildung | Behörden | Sonstige | Keine
2. Sensible Sonderkategorien? Ja/Nein

### Domäne 5 — Barrierefreiheit (BFSG)
Was abgedeckt: BFSG (DE, ab Juni 2025), EAA (EU), WCAG
Kontext-Fragen:
1. In EU verfügbar? (aus Domäne 1 übernommen)
2. Geschäftsmodell? B2C | B2B | Intern
3. Unternehmensgröße? Kleinstunternehmen (<10 MA, <2M) | KMU | Größer | Solo

### Domäne 6 — Werbung / Marketing-Recht
Was abgedeckt: UWG, ePrivacy, Cookie-Richtlinie, Affiliate-Kennzeichnung
Kontext-Fragen:
1. Newsletter? Ja/Nein
2. Tracking/Analytics? GA4 | FB Pixel | Eigene | Keine
3. Affiliate-Links? Ja/Nein
4. Bezahlte Werbung in App? Ja/Nein

### Domäne 7 — Plattform-Compliance (App Store / Play Store)
Was abgedeckt: Apple App Store Guidelines, Google Play Policy
Kontext-Fragen:
1. App Store-Publikation? Ja/Nein
2. Welche? iOS | Android | Beide
3. Typ? Native | PWA | Web-App

### Domäne 8 — Infrastruktur-Compliance
Was abgedeckt: Hosting-Region, CDN, Sub-Auftragsverarbeiter-Pflichten
Kontext-Fragen:
1. Hosting? Vercel/Netlify/CF | AWS/GCP/Azure | Self-hosted | Sonstige
2. CDN? Ja/Nein
3. Drittanbieter? Stripe | SendGrid | Sentry | LLM-APIs | etc. (Multiselect)
`.trim()

const PROFILE_DEFINITION = `
Bestehende 5 Profile (NICHT zur Diskussion — Logik 3 entschieden: Profile = UI-Vereinfachung, Achsen intern):
- Profil 1: Demo / Solo-Tool — kein Login, kein Public-Datenspeicher
- Profil 2: Internes Tool — Multi-User, eigene Org, kein Public Internet
- Profil 3: Public Tool ohne PII — Public Internet, keine personenbezogenen Daten
- Profil 4: B2C-App mit User-Daten — Public Multi-User, Accounts, PII
- Profil 5: B2B / Reguliert — Multi-Org, Compliance, sensible Daten

Markt-Achse: EU-only / Nicht-EU / Global / Egal

WICHTIG: Die 5 Profile bleiben als UI-Konzept bestehen. Intern werden sie auf
multi-dimensionale Compliance-Achsen gemappt. Das Komitee soll empfehlen, welche
Default-Achsen-Werte zu welchem Profil passen.
`.trim()

export const config: CommitteeReviewConfig = {
  name: 'compliance-domains-komitee',

  contextFiles: [
    'docs/adr/027-killer-kriterien-score-pivot.md',
    'docs/active/brand-brief.md',
  ],

  contextTransforms: {
    'docs/active/brand-brief.md': (c) => {
      // Nur Section 28 extrahieren (Coach-Position zweiter Ordnung)
      const lines = c.split('\n')
      const start = lines.findIndex(l => l.startsWith('## 28.'))
      const end = lines.findIndex((l, i) => i > start && l.startsWith('## 29.'))
      const slice = end === -1 ? lines.slice(start) : lines.slice(start, end)
      return slice.join('\n') + '\n\n[Marken-Brief: nur Section 28 geladen — Coach-Position zweiter Ordnung]'
    },
    'docs/adr/027-killer-kriterien-score-pivot.md': (c) =>
      c.split('\n').slice(0, 120).join('\n') + '\n... (Schritt 5+ ab Zeile 120 nicht geladen)',
  },

  systemPrompt: `Du bist Mitglied eines Multi-Model-Komitees für Tropen OS — eine Production-Readiness-Plattform für Vibe-Coder (Entwickler die mit Lovable/Cursor/Bolt Apps generieren).

KONTEXT:
Tropen OS scannt Code-Repositories und findet Production-Readiness-Probleme. Neu: multi-dimensionale Compliance-Achsen statt nur 5 Profile. Die Compliance-Domänen bestimmen, welche Killer-Kriterien und Hinweise aktiv sind.

STRUKTURELLE LÜCKE (Anlass für dieses Komitee):
5 Profile + Markt-Achse (EU/Nicht-EU) reichen nicht für ehrliche Compliance-Prüfung.
Eine App kann EU sein (→ DSGVO aktiv) UND KI haben (→ AI Act aktiv) UND E-Commerce (→ Widerruf aktiv).
Interne Achsen erfassen das; Profile vereinfachen es für den User.

MARKEN-POSITION (Coach-Position zweiter Ordnung, Marken-Brief Section 28):
Tropen OS sagt explizit, was es prüft und was nicht. Heuristisch = explizit sagen "Detection ist heuristisch".
Außerhalb technischer Prüfbarkeit = eigene Hinweis-Sektion, keine Killer-Einstufung.

DREI-EBENEN-KLASSIFIKATION:
- 🛑 Killer: "Veröffentlichung blockiert" (binär)
- 🟠 Polish: "verbessert Qualität, kein Stopper" (heuristisch, Begrenzungs-Aussage)
- 📋 Hinweis: "wir prüfen das nicht — du solltest es prüfen" (externe Links)

COMPLIANCE-STUFEN-SYSTEM:
- Stufe 1: Tropen OS deckt heute ab (automatische Code-Inspektion, Datei-Check)
- Stufe 2: Geplant später (KI-gestützte Inhalts-Prüfung, Premium)
- Stufe 3: Nie (juristische Einzelfall-Beratung — Anwalts-Monopol)

STACK: Next.js 15, Supabase, Vercel, Anthropic SDK. Zielmarkt: DACH primär, EU sekundär.
ZIELGRUPPE: Solo-Gründer die mit KI Apps gebaut haben — keine Juristen, keine Compliance-Experten.

Cybersecurity ist NICHT Compliance-Domäne — ist Universal-Killer-Bereich (ADR-027 Schritt 1-4), bereits implementiert.

Antworte auf alle 4 Fragen vollständig und strukturiert. Spaltungen sind wertvoll — nicht verbergen.`,

  userPrompt: `
${STRAWMAN}

---

${PROFILE_DEFINITION}

---

VIER FRAGEN — BITTE PRO FRAGE VOLLSTÄNDIG ANTWORTEN:

---

FRAGE 1 — VOLLSTÄNDIGKEIT DER DOMÄNEN-LISTE

Pro Domäne aus dem Strawman:
- Bleibt drin? (Ja | Ja mit Anpassung | Streichen)
- Compliance-Stufe? (Stufe 1 heute | Stufe 2 später | Stufe 3 nie)
- Wichtige regionale Erweiterungen die fehlen?

PLUS: Welche Domänen fehlen im Strawman komplett?
Kandidaten zu bewerten: Patentrecht/Markenrecht, Open-Source-Lizenzen (GPL-Pflichten), Spezial-Branchen (Glücksspiel, Finanzberatung), Export-Kontrolle, Arbeitsrecht bei SaaS-Tools

Pro Vorschlag: Begründung + Stufe + Aktivierungs-Profil.

---

FRAGE 2 — KONTEXT-FRAGEN-PRÄZISION

Pro Domäne:
- Sind die Kontext-Fragen ausreichend für ehrliche Prüfung?
- Welche Fragen fehlen oder sind zu grob?
- Redundanzen zu anderen Domänen (welche Fragen könnten geteilt werden)?

Denke vom Vibe-Coder aus: Was wird er wahrscheinlich falsch verstehen?
Was muss besonders einfach formuliert sein?

---

FRAGE 3 — PFLICHT vs OPTIONAL fürs ONBOARDING

Hintergrund: ~25-30 Datenpunkte über alle 8 Domänen = zu viel Reibung beim First-Run.
Lösung: progressive disclosure.

Pro Domäne — Empfehlung mit Begründung:
- PFLICHT = beim First-Run abgefragt, kann nicht übersprungen werden
- EMPFOHLEN = beim First-Run optional, Default-Annahme bei Skip (welche Default-Annahme?)
- LAZY = nicht beim Onboarding, getriggert durch Code-Detektion (wann? was triggert?)
- SETTINGS-ONLY = nicht im Onboarding, nur in Settings

Kriterium für PFLICHT: "Ohne diese Info können wir keine einzige Killer-Kriterien-Aussage machen."
Kriterium für LAZY: "Wir können aus dem Code ableiten, dass die Frage relevant wird."

---

FRAGE 4 — PROFILE UPDATE-VORSCHLAG

Bewerte die bestehenden 5 Profile:
1. Sind sie sinnvoll geschnitten oder überlappen sie zu stark?
2. Sind 5 zu wenig (fehlende Granularität) oder zu viele (User überfordert)?
3. Schlag eine Update-Version vor: neue Namen, Anzahl, Beschreibungen

PRO PROFIL (bestehend oder neu):
- Default-Werte für alle 8 Domänen (was sind die typischen Achsen-Werte bei diesem Profil?)
- Welche Domänen sind bei diesem Profil garantiert aktiv?
- Welche Domänen sind bei diesem Profil garantiert N/A?

FORMAT für Profil-Default-Tabelle:
Profil X | Dom1 | Dom2 | Dom3 | Dom4 | Dom5 | Dom6 | Dom7 | Dom8
Werte: Aktiv | N/A | LAZY (nur wenn Code-Detektion triggert)
`,

  judgePrompt: `4 Modelle haben 8 Compliance-Domänen für eine Vibe-Coder Production-Readiness-Plattform bewertet.
Destilliere den Konsens für alle 4 Fragen. Spaltungen sind wichtig — nicht verstecken.

FORMAT pro Frage:
1. Konsens-Level: EINIG | MEHRHEIT | GESPALTEN
2. Endgültige Empfehlung (konkret)
3. Spaltungs-Argumente falls GESPALTEN (welches Lager sagt was?)

FÜR FRAGE 1 (Vollständigkeit):
- Finale Domänen-Liste: welche 8 (oder mehr/weniger) sind es?
- Pro Domäne: Stufe (1/2/3)
- Lücken-Domänen die hinzukommen: mit Begründung und Priorität

FÜR FRAGE 2 (Kontext-Fragen):
- Welche Kontext-Fragen müssen präzisiert werden?
- Welche können domänen-übergreifend geteilt werden (einmal fragen, mehrfach nutzen)?
- Top-3 Vibe-Coder-Verständnis-Fallen

FÜR FRAGE 3 (Pflicht vs Optional):
Tabelle: Domäne | Pflicht/Empfohlen/Lazy/Settings | Begründung | Default-Annahme bei Skip

FÜR FRAGE 4 (Profile):
- Bewertung der 5 Profile: behalten / anpassen / ersetzen
- Endgültiger Profil-Vorschlag (Name, Beschreibung, Anzahl)
- Default-Werte-Tabelle: Profil × Domäne

ZUSÄTZLICH:
- Spaltungen die Timm entscheiden muss (max. 4, priorisiert)
- Empfehlungen für Folgesprint (Top 5, priorisiert)
- Kosten-Warnung wenn Komplexität überraschend war`,
}
