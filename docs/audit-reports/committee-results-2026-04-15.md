# Komitee-Ergebnisse — 2026-04-15

> 4 Modelle: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4
> Judge: Claude Opus
> Kosten: EUR 0.25

## Frage 1 — Plattform-spezifische Agenten

| Modell | Empfehlung | Begruendung | Risiko |
|--------|-----------|------------|--------|
| Claude Sonnet | B | Generisch reicht fuer MVP, plattform-spezifisch erst mit Nutzerdaten | Lovable-User springen ab wegen generischer Fixes |
| GPT-4o | B | Ressourcenschonung vor PMF, Plattform nur im Report anzeigen | Verpasste Differenzierung gegenueber Konkurrenz |
| Gemini 2.5 Pro | A | Plattform-Erkennung ist low-effort, sofortige Differenzierung | Over-Engineering fuer Plattformen die keiner nutzt |
| Grok 4 | C | Erst nach PMF — echte Nutzerdaten zeigen welche Plattform Prioritaet hat | Zu spaet dran wenn Konkurrent es zuerst baut |
| **Konsens** | **B** (GESPALTEN) | **Generisch bleiben, Plattform im Report anzeigen** | |

## Frage 2 — Score-Algorithmus: Projekt-Typ

| Modell | Empfehlung | Begruendung | Risiko |
|--------|-----------|------------|--------|
| Claude Sonnet | C | Ehrlicher Score + "Top 20% fuer deine Groesse" in UI | Kleine Projekte fühlen sich demotiviert |
| GPT-4o | C | Algorithmus unveraendert, Kontext-Darstellung reicht | Nutzer verstehen den Kontext nicht |
| Gemini 2.5 Pro | C | Kein Score-Gaming ermoeglichen, stattdessen Erklaerung | Hohe Scores fuer grosse Projekte sind irreführend |
| Grok 4 | A | Projekt-Typ-Gewichte geben praezisere Bewertung | Zu viel Konfiguration fuer MVP |
| **Konsens** | **C** (MEHRHEIT) | **Einheitlicher Algorithmus, Kontext in UI** | |

## Frage 3 — UX-Schicht: Wann?

| Modell | Empfehlung | Begruendung | Risiko |
|--------|-----------|------------|--------|
| Claude Sonnet | A | "68 Findings als Liste ist der Tod eines Products" — UX sofort | Falsche UX ohne User-Feedback |
| GPT-4o | A | Checker sind gut genug, Darstellung ist der Aha-Moment | Aha-Moment verfehlt weil UX-Annahmen falsch |
| Gemini 2.5 Pro | A | Sofort — priorisierte Findings + Copy-Paste-Prompts | Over-Investing in UX die keiner will |
| Grok 4 | C | Parallel — UX neben Checker-Ausbau | Weder Checker noch UX werden richtig fertig |
| **Konsens** | **A** (MEHRHEIT) | **Sofort starten — UX ist der Differenziator** | |

## Frage 4 — Manuelle Checks

| Modell | Empfehlung | Begruendung | Risiko |
|--------|-----------|------------|--------|
| Claude Sonnet | C | 5 Ja/Nein-Fragen im Onboarding — low-effort, high-impact | User klicken ueberall Ja |
| GPT-4o | A+C | Transparent markieren + Self-Assessment als Ergaenzung | Zu viele Fragen schrecken ab |
| Gemini 2.5 Pro | C | Self-Assessment fuer kritische Checks (Backups, Monitoring) | Gaming ("ueberall Ja") verfaelscht Score |
| Grok 4 | C | Kurzes Self-Assessment, max 5 Fragen | Onboarding-Friction zu hoch |
| **Konsens** | **C** (MEHRHEIT) | **Self-Assessment im Onboarding, max 5 Fragen** | |

## Blinde Flecken (alle Modelle)

1. **Runtime-Performance unter Last** — Das System prueft Code-Qualitaet aber nicht ob die App bei 1000 Usern funktioniert. Alle Benchmark-Repos sind Demos/MVPs.
2. **Kein echtes Nutzer-Feedback** — 233 Regeln ohne einen einzigen echten User. Relevanz der Regeln ist unvalidiert.
3. **Kein Dependency-Security-Realtime** — npm audit ist Snapshot, keine kontinuierliche Ueberwachung.

## Vibe-Coder-Kritik (alle Modelle)

**Konsens: "68 Findings als flache Liste — gib mir 3 Copy-Paste-Commands"**

Vibe-Coder wollen instant gratification:
- "Fix this first" Button mit den 3 wichtigsten Fixes
- Copy-Paste-Prompts direkt in der Liste (nicht im Drawer versteckt)
- Score-Veraenderung pro Fix sichtbar ("Fixe das → +8 Punkte")

## Entscheidungen

| Frage | Entscheidung | Konsens | Begruendung |
|-------|-------------|---------|-------------|
| 1 — Plattform-Agenten | **B** | GESPALTEN | Plattform anzeigen, nicht optimieren. Erst nach PMF spezialisieren. |
| 2 — Score-Algorithmus | **C** | MEHRHEIT | Einheitlich, aber "Top X% fuer deine Groesse" in UI. |
| 3 — UX-Schicht | **A** | MEHRHEIT | Sofort starten — Quick-Wins-Button + Priorisierung. |
| 4 — Manuelle Checks | **C** | MEHRHEIT | 5 Ja/Nein-Fragen im Onboarding. |

## Naechste Schritte (priorisiert)

| # | Schritt | Aufwand | Impact |
|---|---------|---------|--------|
| 1 | **Quick-Wins-Button**: 3-5 Copy-Paste-Fixes, Score-Prognose pro Fix | 3 Tage | Aha-Moment |
| 2 | **Self-Assessment Light**: 5 Ja/Nein-Fragen im Onboarding | 2 Tage | 64 Regeln aktiviert |
| 3 | **Score-Kontext-UI**: "Top 20% fuer deine Projektgroesse" | 2 Tage | Motivation |
| 4 | **Lovable-Pilot**: 10 Beta-User, Fokus auf Fix-Relevanz | 1 Woche | Validierung |
| 5 | **Plattform-Erkennung**: .bolt/, .cursorrules anzeigen im Report | 1 Tag | Kontext |
