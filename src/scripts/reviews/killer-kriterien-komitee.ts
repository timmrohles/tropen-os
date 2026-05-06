import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'killer-kriterien-komitee',

  contextFiles: [
    'docs/audit-reports/score-diagnose-2026-05-04.md',
    'docs/product/marken-brief.md',
  ],

  contextTransforms: {
    'docs/product/marken-brief.md': (c) =>
      c.split('\n').slice(0, 80).join('\n') + '\n... (gekürzt)',
  },

  systemPrompt: `Du bist Mitglied eines Multi-Model-Komitees für Tropen OS — eine Production-Readiness-Plattform für Vibe-Coder (Entwickler die mit Lovable/Cursor/Bolt arbeiten).

KONTEXT:
Der bisherige Audit-Score (0-100%) hat ein Kalibrierungsproblem: Benchmark-Repos erreichen max. 87.8%, +5 high-Findings = 0.268% Score-Bewegung. Der Score ist zu unempfindlich für echte Qualitätsprobleme.

STRATEGISCHER PIVOT: Killer-Kriterien werden primär. Die Coach-Frage ist binär: "Kann ich das veröffentlichen?" — nicht "Wie viel Komma-Prozent hat mein Code?"

Killer-Kriterien sind Findings die Veröffentlichung blockieren, unabhängig von ihrer Severity-Einstufung (1-4). Sie sind kontextspezifisch nach Profil.

FÜNF PROFILE (fertige Annahme — nicht diskutieren):
- Profil 1: Demo/Solo-Tool — kein Login, kein Public-Datenspeicher
- Profil 2: Internes Tool — Multi-User, eigene Org, kein Public Internet
- Profil 3: Public Tool ohne PII — Public Internet, keine personenbezogenen Daten
- Profil 4: B2C-App mit User-Daten — Public Multi-User, Accounts, PII
- Profil 5: B2B/Reguliert — Multi-Org, Compliance, sensible Daten

MARKT-ACHSE: EU-only / Nicht-EU / Global / Egal

SEVERITY-DEFINITION:
- critical (4): Datenverlust, Sicherheitsbruch
- high (3): Auth, Error-Handling, DSGVO-Pflichten
- medium (2): Code-Qualität, Wartbarkeit
- low (1): Stil, Optimierung

COACH-STIMME: konkret, beobachtend, ohne Drohung. Format: Beobachtung + Konsequenz + Vorschlag.

Beantworte alle 4 Fragen präzise und strukturiert.`,

  userPrompt: `VIER FRAGEN — BITTE PRO FRAGE VOLLSTÄNDIG ANTWORTEN:

---

FRAGE 1 — VERFEINERUNG DER STARTLISTE

Pro Kriterium: Bleibt drin? Welche Profile aktivieren es? Schwellwert (falls nicht binär)?

STARTLISTE:

Universal (alle Profile):
- Hardcoded Secrets / API Keys / Tokens im Code
- Production-Build bricht ab
- SQL-Injection-Risiko (String-Konkatenation in Queries)

Public (Profile 3, 4, 5):
- Open CORS auf Public Endpoints
- Keine HTTPS-Erzwingung
- Server gibt Stack Traces an Client zurück

Multi-User (Profile 4, 5):
- API-Routes ohne Auth-Check
- Tenant-Isolation fehlt (queries ohne org-filter)
- PII in Logs

EU-Markt:
- Kein Cookie-Banner bei Tracking-Cookies
- DSGVO Art. 32: Backup-Pflicht (PITR oder vergleichbar)
- Datenschutzerklärung fehlt
- Newsletter-Double-Opt-In fehlt (falls Newsletter)

B2B/Reguliert (Profil 5):
- Audit-Logs fehlen für sensible Operationen
- Zugriffsrechte-Modell undokumentiert
- Soft-Delete statt Hard-Delete für User-Daten

---

FRAGE 2 — LÜCKEN IN DER STARTLISTE

Welche Killer-Kriterien fehlen? Pro Vorschlag: Profil-Aktivierung + Schwellwert + 1-Satz-Begründung.

---

FRAGE 3 — COACH-WORDING

Pro endgültigem Kriterium ein UI-Wording-Beispiel im Coach-Stil.
Format: "🛑 Stopper: [Was gefunden]. [Konsequenz]. [Vorschlag]."
Maximal 3 Sätze. Keine Drohung, keine Predigt.

Beispiel:
"🛑 Stopper: API-Key direkt im Code gefunden (src/lib/api.ts).
Jeder mit Repo-Zugriff kann den Key lesen — auch nach Löschen bleibt er in der Git-History.
Lösung: Key in .env.local packen, .env.local in .gitignore, Key beim Provider rotieren."

---

FRAGE 4 — KOLLISIONS-BEHANDLUNG

Was passiert wenn ein Repo mehrere Killer-Kriterien verletzt?

A — Liste aller Stopper, User entscheidet Reihenfolge
B — Schweregradierung innerhalb der Killer-Liste
C — Domain-Gruppierung (Sicherheit / DSGVO / Code / etc.)

Empfehlung mit Begründung. Welche Option passt am besten zur Coach-Position?`,

  judgePrompt: `4 Modelle haben unabhängig Killer-Kriterien für eine Production-Readiness-Plattform (Vibe-Coder-Zielgruppe) erarbeitet. Destilliere den Konsens für alle 4 Fragen.

Pro Frage:
1. Konsens-Level: EINIG | MEHRHEIT | GESPALTEN
2. Endgültige Empfehlung
3. Wichtigste Spaltungs-Argumente (falls GESPALTEN)

FÜR FRAGE 1 (Startliste): Pro Kriterium: Bleibt/Streichen/Anpassen + Profil-Aktivierung
FÜR FRAGE 2 (Lücken): Priorisierte Liste der Lücken-Vorschläge (max. 8)
FÜR FRAGE 3 (Wording): Pro Kriterium ein finales Coach-Wording (kompakt, max. 3 Sätze)
FÜR FRAGE 4 (Kollision): Klare Empfehlung A/B/C

ZUSÄTZLICH:
- Endgültige Killer-Kriterien-Liste als Tabelle: Kriterium | Profile | Schwellwert
- Für Timm zu entscheidende Spaltungen (max. 3)
- Top-3-Empfehlungen für Folgesprint (Implementation)`,
}
