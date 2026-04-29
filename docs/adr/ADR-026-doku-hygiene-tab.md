# ADR-026 — Doku-Hygiene als siebter Domain-Tab

**Status:** Draft (24h-Wartezeit bis 2026-04-30)
**Datum-Entwurf:** 2026-04-29
**Autor:** Timm Rotter
**Quelle:** Sparring-Erkenntnis 2026-04-29 — Doku-Drift als Self-Dogfood + Markt-Schmerz
**Verwandte ADRs:** ADR-025 (Domain-Tab-Architektur — wird durch diesen ergänzt, nicht ersetzt)

---

## ⚠️ Status-Hinweis

Dieser ADR steht unter 24h-Wartezeit nach Pivot-Disziplin (CLAUDE.md).
Entwurf 2026-04-29. Finale Bestätigung oder Verwerfung am 2026-04-30.

Verwerfung ist legitim und erwünscht, falls Timm beim erneuten Lesen
strategische Schwäche oder Sparring-Reflex erkennt. Diese Notiz dient als
Test der Pivot-Disziplin — nicht als Auto-Bestätigung.

---

## Kontext

ADR-025 vom 2026-04-29 hat sechs Domain-Tabs als verbindliche Architektur
festgelegt. Vier bis sechs Stunden später ist im Sparring eine Erkenntnis
aufgetaucht, die einen siebten Tab vorschlägt: **Doku-Hygiene**.

Anlass war eine Meta-Beobachtung: in dieser Sparring-Session selbst hat sich
gezeigt, dass Tropen OS (das Produkt) bereits unter Doku-Drift leidet — README
sagt 242 Rules, frühere Sparring-Annahmen gingen von 183 aus, CLAUDE.md ist
mit 1679 Zeilen substanziell, aber zwischen den Doks gibt es Inkonsistenzen
in Zahlen, Konventionen, Aktualität.

Diese Beobachtung führt zu zwei zusammenhängenden Erkenntnissen:

1. **Self-Dogfood:** Tropen OS als Projekt selbst hat Doku-Drift. Das passende
   Tool für sich selbst zu haben wäre konsistent mit Coach-Position.
2. **Markt-Schmerz:** Vibe-Coder kopieren Doku-Snippets (CLAUDE.md, .cursorrules)
   ständig in neue Chat-Sessions. Die kopierten Snippets sind oft veraltet.
   Drift zwischen Doku-Versionen ist ein systematisches Problem.

## Entscheidung

**Vorbehaltlich 24h-Wartezeit:** Audit-Tab-Architektur erweitert auf
sieben Domain-Tabs durch Hinzufügen von:

```
Tab 7: Doku-Hygiene
Domain-Code: documentation
Datenquellen MVP: eigene Engine
Datenquellen Roadmap: KI-basiert (Anthropic API für Inhaltsvergleich)
Status MVP: Aktiv (nach Tab-Sprint, eigene Mini-Phase)
```

### Anker-Position

**Doppelter Anker:**

- **Self-Dogfood:** "Wir merken's an uns selbst — Tropen OS hat 1679 Zeilen
  CLAUDE.md, 26 Doks, fünf widersprüchliche Zahlen-Stände. Das Tool, das wir
  für andere bauen, brauchen wir selbst."

- **Markt-Schmerz:** "Vibe-Coder kopieren CLAUDE.md / .cursorrules in jeden
  neuen Chat. Die Quelle wird selten aktualisiert. Die KI lebt in einer
  Vergangenheit, die der Code längst hinter sich gelassen hat. Tropen OS
  zeigt diesen Drift."

Beide Anker werden in Marketing kommuniziert. Self-Dogfood als
Glaubwürdigkeits-Story, Markt-Schmerz als Verkaufs-Argument.

### Initial-Scope der Doku-Hygiene-Rules

Fünf Rule-Familien werden in der Initial-Phase implementiert:

| Familie | Erkennung | Schwierigkeit |
|---------|-----------|---------------|
| Daten-Stamps | Datum-Header, Update-Frequenz, "letzte Änderung > 6 Monate" | Niedrig (regex + git-blame) |
| Verwaiste Doks | Doks ohne Verlinkung aus README oder anderen Doks | Mittel (Link-Graph-Analyse) |
| Widersprüchliche Konventionen | Z.B. CLAUDE.md sagt PascalCase, engineering-standard.md sagt kebab-case | Hoch (KI-basierter Vergleich) |
| Zahlen-Inkonsistenz | Z.B. "242 Rules" in README vs. "183 Rules" in CLAUDE.md | Hoch (KI-Extraktion und Vergleich) |
| Mehrfach-Quellen | Gleicher Fakt in mehreren Doks dokumentiert (Drift-Risiko) | Hoch (KI-basierte Themen-Cluster) |

Drei der fünf Familien sind **KI-basiert** (Widerspruch, Zahlen, Mehrfach-Quellen).
Das passt zur bestehenden Multi-Model-Komitee-Infrastruktur — Doku-Vergleich
ist analog zu Code-Review.

### Reihenfolge — Diszipliniert

**Erst sechs Tabs sauber, dann siebter.**

1. Tab-Sprint mit ursprünglichen sechs Domain-Tabs (in Build, nicht zu erweitern)
2. Tab-Sprint-Abschluss + L2-Outreach (Validierung der ursprünglichen Architektur)
3. **Mini-Phase 7 nach Tab-Sprint:** Doku-Hygiene-Tab als eigenständige
   Erweiterung
4. Erst nach Mini-Phase 7: BP8/BP9/BP10 (verbleibender Sprint 1)

Aufwand Mini-Phase 7: ~5-8 PT (geschätzt, basierend auf bestehender Tab-
Infrastruktur).

## Konsequenzen

### Positiv

- **Tropen OS wird konsistent mit eigenem Doku-Stand** (Self-Dogfood gelöst)
- **Markt-Argument** für Vibe-Coder ergänzt (Drift zwischen Code und Doku ist
  reales Problem)
- **Multi-Model-Infrastruktur wird zweitverwertet** — die KI-basierten Rules
  nutzen bestehende Anthropic + AI Gateway-Integration
- **Pivot-Disziplin gewahrt** — siebter Tab kommt nach Tab-Sprint, nicht während
- **24h-Wartezeit** verhindert Sparring-Reflex-Entscheidung

### Negativ

- **ADR-025 wird ergänzt — sieben Tabs statt sechs.** Das macht die
  ursprüngliche "sechs ist genug"-Begründung schwächer
- **Mobile-Verhalten** wird mit sieben Tabs schwieriger (horizontaler Scroll
  bei sehr engen Viewports nicht ideal)
- **Self-Dogfood als Anker** ist verkaufstechnisch schwächer als
  user-zentrierte Anker
- **Ohne L2-Validierung** ist der Markt-Anker (Vibe-Coder leiden auch) nicht
  bestätigt — könnte Tropen-spezifisches Problem sein
- **Mini-Phase 7 verschiebt Sprint 1** um weitere ~5-8 PT (ein zusätzlicher
  Wartebereich für BP8/BP9/BP10)

### Risiken

- **Pivot-Spirale:** Dies ist der zweite ADR innerhalb von 24 Stunden. Das ist
  schon Indiz auf Reflex-Verhalten. Mitigation: 24h-Wartezeit ernst nehmen.
- **Doku-Hygiene als zu schmaler Tab:** Wenn nur fünf Rule-Familien existieren
  und keine Drittanbieter-Integration absehbar, könnte der Tab dauerhaft dünn
  bleiben. Alternative wäre Sub-Kategorie in code-quality. Mitigation: nach
  drei Monaten Tab-Nutzung evaluieren.
- **Self-Dogfood überdimensioniert:** Wenn Tropen OS als Solo-Founder-Projekt
  unter Doku-Drift leidet, heißt das nicht zwingend, dass Vibe-Coder-Teams
  davon leiden. L2-Outreach muss das prüfen.

## Mitigation der Risiken

1. **24h-Wartezeit ernst nehmen** — am 2026-04-30 ehrlich prüfen, ob diese
   Entscheidung Sparring-Reflex oder strategische Klarheit war.
2. **L2-Outreach mit Doku-Hygiene-Frage** — bei den drei Vibe-Coder-Calls
   explizit fragen: "Habt ihr Probleme mit Doku-Drift in eurem Projekt?"
3. **Drei-Monate-Evaluation** — wenn Doku-Tab implementiert ist, nach drei
   Monaten echter Nutzung evaluieren: viele Findings? Viele User schauen rein?
   Wenn beides negativ: Tab zurück zur Sub-Kategorie umbauen.

## Implementierung

**Mini-Phase 7 (nach Tab-Sprint Phase 5):**

1. Domain-Type erweitern auf `documentation`
2. Tab-Konfiguration in `AppTabs.tsx` auf sieben Tabs erweitern
3. Fünf Doku-Hygiene-Checker schreiben (`src/lib/audit/checkers/documentation/`)
4. Mobile-Verhalten testen (sieben Tabs mit Scroll)
5. Coming-Soon-Empty-State falls Drittanbieter-Integration später
6. Domain-Mapping in `domain-mapping.md` ergänzen
7. CLAUDE.md aktualisieren — siebter Tab als Code-Regel
8. Roadmap-Eintrag

Build-Prompt: `BP-Doku-1` (zu schreiben falls ADR-026 nach 24h bestätigt wird).

## Validierung am 2026-04-30 (Selbst-Check)

Folgende Fragen müssen morgen ehrlich beantwortet werden, bevor diese ADR
finalisiert wird:

1. Habe ich diesen ADR aus strategischer Klarheit oder aus Sparring-Reflex
   geschrieben?
2. Ist Doku-Hygiene wirklich groß genug für einen eigenen Tab, oder reicht
   eine Sub-Kategorie?
3. Was sagt mein Bauchgefühl, wenn ich morgen die README lese und feststelle,
   dass dort plötzlich sieben Tabs stehen würden?
4. Wäre ich bereit, das im Vibe-Coder-Outreach (L2) so zu pitchen?
5. Welche zweite, dritte Frage zur ursprünglichen Sechs-Tab-Architektur stellt
   sich, wenn ich morgen frisch herangehe?

Bei mindestens **zwei skeptischen Antworten** wird ADR-026 verworfen oder
in Sub-Kategorie-Variante umgewandelt.

## Alternative falls ADR-026 morgen verworfen wird

Wenn am 2026-04-30 die 24h-Validierung negativ ausfällt:

- Doku-Hygiene wird Sub-Kategorie in `code-quality`
- Keine Tab-Erweiterung, keine ADR-026-Finalisierung
- Wildwuchs-Backlog-Notiz wird ergänzt um Doku-Hygiene als zweite
  Sub-Domain (analog zu Repo-Hygiene)
- Marketing-Story bleibt erhalten, aber ohne eigenen Tab

Dies ist die **disziplin-konforme Rückzugsoption** und sollte nicht als
Niederlage verstanden werden.

## Referenzen

- ADR-025 (Domain-Tab-Architektur)
- CLAUDE.md (Pivot-Disziplin, sechs Domain-Tabs)
- Sparring-Erkenntnis 2026-04-29 (Self-Dogfood + Markt-Schmerz)
- Backlog-Notiz `docs/strategie/2026-04-build-modus-wildwuchs.md` (Repo-Hygiene als
  thematisch verwandt)

---

## ⏱ 24h-Wartezeit-Marker

```
Entwurf:        2026-04-29 [Uhrzeit eintragen]
Validierung am: 2026-04-30 [Uhrzeit eintragen + 24 Stunden]
Status nach Validierung: [BESTÄTIGT / VERWORFEN / UMGEWANDELT in Sub-Kategorie]
Validierungs-Notiz: [hier morgen schreiben]
```
