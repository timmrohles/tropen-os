# Komitee-Review — Tropen OS Audit-System

> Datum: 2026-04-15
> Status: Bereit fuer Review
> Reviewer: Claude Sonnet + GPT-4o + Gemini 2.5 Flash + Grok 4 → Opus-Judge

## Executive Summary

Tropen OS hat einen vollstaendigen Production Readiness Scanner fuer Vibe-Coder gebaut: 233 Regeln in 25 Kategorien, abgedeckt durch 27 Agenten, getestet an 49 oeffentlichen GitHub-Repos (41 Lovable, 3 Bolt, 3 Cursor, 2 Manual). Der Score differenziert (StdDev 6.5, Spread 40%, 32 Stable / 16 Risky / 1 Prototype) und die Checker erkennen echte Code-Qualitaets-Probleme via AST-Parsing (Cognitive Complexity, God Components, Error Handling, N+1 Queries).

## Benchmark-Ergebnisse (v7-final)

| Gruppe | Repos | Avg Score | Range | Verteilung |
|--------|-------|-----------|-------|------------|
| **Gesamt** | 49 | 79.7% | 48–88% | 32 Stable, 16 Risky, 1 Prototype |
| Lovable | 41 | 79.7% | 48–85% | Hauptzielgruppe |
| Bolt | 3 | 70.9% | 64–80% | Niedrigste Qualitaet |
| Cursor | 3 | 83.2% | 83–84% | Hoechste Konsistenz |
| Manual (CI) | 2 | 85.8% | 84–88% | Hoechste Qualitaet |

## Checker-Stack

- **233 Regeln** (169 automatisiert, 64 manuell)
- **25 Kategorien** vollstaendig abgedeckt
- **27 Agenten** zugeordnet (ANALYTICS→cat-12, CONTENT→cat-17)
- **AST-Checks:** Cognitive Complexity, God Components, Error Handling, Secrets, Circular Imports, any-Usage, N+1 Queries, Error Boundary
- **Compliance:** DSGVO, AI Act, BFSG, E-Commerce, Affiliate (profil-gated)

## Was gut funktioniert

1. **Score-Differenzierung:** 40% Spread (von 5% in v1). Projekte mit CI scoren 87%, Bolt-Projekte 71%.
2. **AST-basierte Checks:** Finden echte Probleme (CC=191 in Onboarding.tsx, 27 useState in SettingsModal.tsx).
3. **Profil-Gate:** Compliance-Checks feuern nicht ohne Profil → kein Score-Noise.
4. **Noise-Bereinigung:** PascalCase-FP von 85% auf 0%, Typosquatting-FP auf 0%.
5. **Scan-Geschwindigkeit:** 49 Repos in 75 Sekunden (1.5s/Repo).

## Was noch offen ist

1. **Kein Production-Grade Repo:** Selbst Manual-Repos erreichen nur 88%. Schwellenwert 90% ist sehr hoch.
2. **64 manuelle Regeln:** Nicht automatisch pruefbar — zaehlen nicht im Score.
3. **Plattform-spezifische Fix-Prompts:** Bolt braucht andere Prompts als Cursor.
4. **UX-Schicht:** Findings als flache Liste — keine Priorisierung, keine Gruppierung.
5. **Einzelner Nutzer:** Noch kein echtes User-Feedback.

## Offene Entscheidungen fuer das Komitee

### Frage 1 — Plattform-spezifische Agenten

**Kontext:** Benchmark zeigt systematische Score-Unterschiede:
Manual 87.8% > Cursor 83.2% > Lovable 79.7% > Bolt 70.9%

Die Unterschiede kommen aus echten Mustern:
- Lovable: God Components in src/pages/, kein Error Boundary, shadcn/ui
- Bolt: fetch ohne Error-Handling, Remix/Vite statt Next.js
- Cursor: .cursorrules erzwingt bereits Best Practices

**Optionen:**
A) Plattform-spezifische Checker und Fix-Prompts (aufwaendig, Differenziator)
B) Generisch bleiben, Plattform nur im Report anzeigen (einfach, MVP)
C) Erst nach PMF wenn echte Nutzerdaten vorliegen

**Empfehlung:** B fuer MVP — Plattform-Erkennung und -Anzeige kostet wenig, gibt aber Kontext. Spezifische Fix-Prompts erst wenn wir wissen welche Plattform die meisten Nutzer hat.

### Frage 2 — Score-Algorithmus: Projekt-Typ

**Kontext:** Ein 28-Datei-Projekt bekommt 48% (Prototype), ein 269-Datei-Projekt 84% (Stable). Der Complexity-Faktor bestraft kleine Projekte — absichtlich, aber aggresiv.

**Optionen:**
A) Projekt-Typ als Profil-Feld (portfolio/saas/api) mit angepassten Gewichten
B) Complexity-Faktor mildern (Exponent reduzieren)
C) Einheitlicher Algorithmus, Kontext in der Darstellung ("Score fuer ein Projekt dieser Groesse")

**Empfehlung:** C — der Algorithmus bleibt gleich, aber die UI zeigt: "Dein Score im Vergleich zu aehnlich grossen Projekten: Top 20%". Das gibt Kontext ohne den Score zu verfaelschen.

### Frage 3 — UX-Schicht: Wann?

**Kontext:** Der Checker-Stack ist vollstaendig. Die naechste Wertschoepfung kommt aus der Darstellung: "Was zuerst fixen?" statt 68 Findings als Liste.

**Optionen:**
A) Sofort — UX ist der Differenziator, Checker sind gut genug
B) Nach erstem Nutzer-Test — erst echtes Feedback abwarten
C) Parallel — UX-Sprint neben weiterem Checker-Ausbau

**Empfehlung:** A — der Checker-Stack ist ausreichend fuer MVP. Jede weitere Checker-Verbesserung hat abnehmenden Grenznutzen. Die UX-Schicht (Priorisierung, Fix-Prompts, "Heute fixbar") ist der Aha-Moment fuer den Nutzer.

### Frage 4 — Manuelle Checks

**Kontext:** 64 Regeln (27%) sind manuell — nicht automatisch pruefbar. Beispiele: AVV mit Drittanbietern, Lasttests durchgefuehrt, Branch-Protection aktiv.

**Optionen:**
A) Als "nicht geprueft" im Report markieren (transparent)
B) LLM-basierter Review: Agent liest Code und bewertet heuristisch
C) Self-Assessment: Nutzer beantwortet Fragen im Onboarding

**Empfehlung:** A fuer MVP, C als naechster Schritt. Self-Assessment-Fragen im Onboarding ("Hast du Backups aktiviert? Ja/Nein") sind niedrig-aufwaendig und erhoehen die Score-Praezision erheblich.

## Naechste Schritte (Vorschlag)

1. Komitee-Entscheidungen zu den 4 Fragen
2. UX-Schicht basierend auf Entscheidung Frage 3
3. Erster echter Nutzer-Test (5 Beta-User)
4. Plattform-Erkennung basierend auf Entscheidung Frage 1
5. Self-Assessment-Integration basierend auf Entscheidung Frage 4
