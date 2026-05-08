---
status: accepted
updated: 2026-05-08
review_by: 2027-05-08
supersedes: []
superseded_by: null
extends: docs/decisions/028-pivot-to-companion-platform.md
author: Tim Rohles (Solo-Founder), informed by ai-discoverability committee runs (2026-05-08, including followup) and Opus-Judge synthesis with Sonnet fallback in run 2
---

# ADR-029 — Audit Category 27: Web Discoverability & AI Readiness

---

## Kontext

Die Audit-Realität für Vibe-Coder hat sich 2026 verschoben. AI-Crawler wie GPTBot, anthropic-ai, ClaudeBot und PerplexityBot crawlen produktiv und in steigender Frequenz. Vibe-Coder, die mit Lovable, Cursor oder Claude Code eine SaaS bauen, stehen vor einer Frage, die sie meist nicht stellen können: Will ich, dass diese Crawler meinen Inhalt indexieren — oder nicht? Soll meine Site in AI-Antworten auftauchen, soll sie es nicht? Wie kommunizieren OpenGraph-Tags meine Marke beim Link-Sharing? Was passiert mit Duplicate-Content?

Diese Fragen sind nicht neu in der Web-Welt, aber sie waren bisher SEO-Spezialisten-Domäne. Mit AI-Crawlern werden sie zur Vibe-Coder-Pflicht. Und Tropens 26 Audit-Kategorien decken sie nicht ab — Performance via Lighthouse ist erfasst, alles andere zur Web-Sichtbarkeit ist eine weiße Fläche.

Standards in diesem Bereich sind in Bewegung. llms.txt ist Community-Vorschlag ohne RFC-Stabilisierung. AI-Crawler-Direktiven entwickeln sich pro Anbieter unterschiedlich. Was 2026 gilt, kann 2027 anders aussehen.

---

## Entscheidung

Tropen OS führt eine 27. Audit-Kategorie "Web Discoverability & AI Readiness" ein — sechs Regeln, profil-gebunden.

### Sechs Regeln im Überblick

| Regel | Profil-Bindung | Severity | Gewicht |
|-------|----------------|----------|---------|
| robots.txt | ≥ 2 (Profil 2 = blockieren) | high | 3 |
| OpenGraph | ≥ 3 | medium–high | 2–3 |
| sitemap.xml | ≥ 3 | medium | 2–3 |
| JSON-LD | ≥ 3 (als AI-Readiness-Wette markiert, siehe Abschnitt Wetten) | medium | 2 |
| llms.txt | ≥ 3 (Hybrid-Trigger, siehe unten) | low–info | 1 |
| Canonical | ≥ 4 | low | 1 |

### Implementierungs-Reihenfolge für Profil 3

Standard-Vibe-Coder-SaaS, mit drei Komitee-Runs validiert:

| Position | Regel | Begründung |
|----------|-------|------------|
| 1 | OpenGraph | Höchster user-sichtbarer Impact durch Social-Media-Sharing |
| 2 | robots.txt | Kritische Crawler-Kontrolle, einfache Implementierung |
| 3 | sitemap.xml | SEO-Foundation, mittlerer Aufwand |
| 4 | JSON-LD | Moderate AI-Readiness-Substanz |
| 5 | llms.txt | Experimentell, advisory-only |
| 6 | Canonical | Niedriger Schmerz für Standard-SPAs (rückt erst bei Profil 4 nach vorne) |

### llms.txt-Trigger-Logik (Hybrid)

- **Keine llms.txt im Repo** → Tropen meldet ein Info-Finding ohne Score-Impact mit dem Hinweis, dass llms.txt zur AI-Crawler-Awareness gehört und für Projekte mit AI-Sichtbarkeitsanspruch sinnvoll sein kann.
- **llms.txt vorhanden, aber Format inkorrekt** → Tropen meldet ein Should-Finding mit Score-Impact und Format-Hinweis.

Die Hybrid-Variante ist Kompromiss zwischen Innovation (sanfte Awareness-Schaffung) und Vorsicht (kein Spam-Effekt durch aggressives Findings-Feuern bei einem nicht-stabilen Standard).

JSON-LD wird als AI-Readiness-Wette markiert. Die Aufnahme in Profil ≥ 3 bei Severity medium ist bewusste Setzung mit Falsifikations-Risiko (Detail in Abschnitt "Wetten und Falsifikations-Kriterien").

---

## Architektur-Konsequenzen

**Audit-Engine wird um 27. Kategorie erweitert.** Sechs neue Regeln gehen in den rule-registry, die heutige 255-Regel-Engine wird zu 261. Strukturell ist das Erweiterung, nicht Umbau.

**Profil-Bindung wird verbindliches Konzept.** Profil-gebundene Regeln gibt es heute bereits in einigen Kategorien angedeutet, aber unsystematisch. Mit ADR-029 wird Profil-Bindung als architektonisches Konzept der Audit-Engine verbindlich gesetzt — pro Regel ist eine Profil-Schwelle (`min_profile`) deklariert, unterhalb derer die Regel nicht feuert. Das ist eine architektonische Setzung über Kategorie 27 hinaus — künftige Kategorien werden sich daran orientieren müssen. Die formale Definition des Profil-Systems (Profile 1–4) ist Gegenstand einer eigenen Folge-ADR (siehe "Was nicht entschieden wird").

**llms.txt-Trigger-Logik wird Präzedenzfall für experimentelle Standards.** Die Hybrid-Logik (Existenz-Check als Info, Format-Check als Should bei Vorhandensein) ist eine neue Trigger-Klasse für Audit-Regeln, die "experimentell" markierte Standards adressieren. Auch dies ist architektonische Setzung über Kategorie 27 hinaus — künftige Standards mit unklarer RFC-Stabilität werden dieselbe Logik verwenden können.

**Verknüpfung mit Achse 9 (Doku-Hygiene).** Beide Kategorien adressieren strukturelle Drift, die andere AI-Code-Review-Tools nicht erfassen — Achse 9 die Doku-Drift, Kategorie 27 die Discoverability-Drift. Die Substanz "wir sehen, was andere nicht sehen" wird durch beide getragen. Das ist nicht Zufall — es ist Tropens Marken-Position, die sich strukturell wiederholt.

**Ansatz C wird durch Kategorie 27 dringender.** Das Backlog-Item "Lighthouse-Findings nach Typ trennen" (Ansatz C) wird durch ADR-029 zur Voraussetzung für sauberen Build von Kategorie 27. Lighthouse-Findings und Web-Discoverability-Findings können sonst inkonsistent priorisiert werden, was die UX der Findings-Liste untergräbt. Konsequenz: Wenn Ansatz C beim Build-Start von Kategorie 27 nicht durch ist, schweigen Web-Discoverability-Findings — sie feuern erst, wenn Ansatz C produktiv läuft. Severity-Anhebung von Ansatz C im Backlog ist Folge-Aktion (siehe Consequences).

**Bestehende 26 Kategorien bleiben unberührt.** Kein Umbau an rule-registry-Strukturen, keine Änderung an Severity-Sortierung, keine Anpassung an Killer-Logik. ADR-029 fügt hinzu, ändert nicht.

---

## Sequenzierung

Alle sechs Regeln gehören in die Build-Phase der ADR-028-Sequenzierung (zwischen Foundation und Beta-Polish). Sie sind klar definierte Audit-Regeln mit messbaren Ergebnissen, kein Foundation-Pflichtelement und kein Polish-Detail.

**Voraussetzung Ansatz C.** Build kann Kategorie 27 nicht starten ohne durchgeführten Ansatz C (Lighthouse-Findings nach Typ trennen). Wenn Ansatz C nicht durch ist, schweigen Web-Discoverability-Findings — sie feuern erst, wenn die Findings-UX durch Ansatz C kategorisierungsfähig ist. Diese Voraussetzungs-Logik ist explizit gesetzt, weil eine inkonsistente Findings-Liste die Wahrnehmung beider Bereiche untergräbt.

**Reihenfolge im Build.** Die Implementierungs-Reihenfolge folgt dem Komitee-Konsens für Profil 3 (siehe Entscheidungs-Block). Insbesondere OpenGraph zuerst — der Komitee-Konsens war einstimmig, dass user-sichtbarer Schmerz der bessere Validierungs-Indikator ist als Foundation-Hygiene. Wenn die Marken-Vorschau beim LinkedIn-Posting hässlich aussieht, merkt der Vibe-Coder es sofort. Wenn er GPTBot blockt oder zulässt, merkt er es vielleicht nie.

---

## Wetten und Falsifikations-Kriterien

ADR-029 ruht auf einer expliziten Wette. Bei substantieller Falsifikation ist eine neue ADR erforderlich, die Kategorie 27 oder einzelne Regeln überprüft.

**Wette — AI-Readiness ist nachhaltig, kein Hype.** Wir setzen darauf, dass Web-Discoverability- und AI-Crawler-Awareness in den nächsten 12–18 Monaten wachsen in Bedeutung — nicht abnehmen. Insbesondere setzen wir darauf, dass Vibe-Coder in EU/DACH zunehmend bewusst entscheiden wollen, wie sie für AI-Crawler sichtbar werden.

**Falsifikation:** Wenn 2027 keine Vibe-Coder-Apps mehr OG-Tags pflegen, weil AI-Crawler ohnehin allen Inhalt indexieren und Pflege überflüssig wird — wenn parallel im Vibe-Coder-Diskurs (Lovable-Best-Practices, Cursor-Communities, Indiehackers, OMR-Fachthemen) die Web-Discoverability-Pflege erkennbar zurückgeht — ist die Wette falsifiziert. Vibe-Coder-Schmerz an sich ist nicht Wette: Komitee-Konvergenz über drei Runs hat den Schmerz validiert.

Bei Falsifikation der Wette ist Kategorie 27 strukturell zu überdenken — möglicherweise Reduktion auf nur die robots.txt-Substanz, möglicherweise andere Profil-Bindungen, möglicherweise vollständige Streichung.

---

## Was nicht entschieden wird

**Profil-System-Detail (Profile 1–4).** Wir verwenden in ADR-029 die Profil-Schwellen ≥ 2, ≥ 3, ≥ 4 — aber die formale Definition des Profil-Systems selbst ist nicht in ADR-029 enthalten. Dies ist Gegenstand einer eigenen Folge-ADR (ADR-030), die das Profil-System als architektonisches Konzept der Audit-Engine setzt. Bis dahin ist die Profil-Verwendung in ADR-029 pragmatisch, nicht formal. *Wann zu entscheiden:* vor Build-Start von Kategorie 27.

**Audit-Engine-Architektur für profil-gebundene Regeln.** Wie genau Profil-Bindung im rule-registry technisch umgesetzt wird (Datenfeld pro Regel, Profil-Vererbung, Konfigurations-Abfrage zur Run-Time), ist Implementierungs-Detail und gehört in den Build-Prompt. *Wann zu entscheiden:* in der Build-Phase, durch Claude Code in Abstimmung mit ADR-030.

**Severity-Wertung-Logik.** Wie Kategorie 27 in die Score-Berechnung der Audit-Engine einfließt — ob die sechs Regeln gleichgewichtet zu bestehenden Kategorien wirken oder ob Kategorie 27 ein eigenes Sub-Score-Konzept bekommt — bleibt offen. *Wann zu entscheiden:* in der Build-Phase, getrieben von empirischer Beobachtung der Findings-Verteilung.

**Roadmap-Prio-Frage.** Ob Kategorie 27 vor oder nach anderen Build-Items dran ist, ist nicht gesetzt. *Wann zu entscheiden:* bei Build-Phasen-Sprint-Planung.

**Konkrete Implementierungs-Architektur.** Welche Bibliotheken, welche Test-Strategie, welche Code-Struktur die sechs Regeln bekommen, ist Build-Prompt-Substanz. *Wann zu entscheiden:* vor Build-Start.

---

## Consequences

### Positive Konsequenzen

ADR-029 erweitert den Substanz-Hebel der Audit-Engine. Sechs neue Regeln bringen den Bestand von 255 auf 261 Regeln — diese Größe ist substantiell und schwer für Konkurrenten zu replizieren.

Die Profil-Bindung als verbindlich gesetztes architektonisches Konzept macht die Audit-Engine kontextsensibler. Statt "alle Regeln gegen alle Repos" wird Audit graduell kontext-bewusst.

ADR-029 stärkt die Marken-Position. Tropen führt mit "AI Readiness" eine Audit-Kategorie ein, die andere Audit-Tools heute nicht haben. In Kombination mit Achse 9 (Doku-Hygiene) etabliert sich das Muster "Tropen sieht Drift, den andere nicht sehen" als wiederkehrende Substanz-Linie.

### Negative Konsequenzen und Risiken

**Hype-Risiko ist substantiell.** "AI Readiness" ist 2026 Hüll-Wort — nicht stabilisierter Begriff. Wette 1 ruht darauf, dass dieser Bereich strukturell wächst statt einzubrechen.

**False-Positive-Risiko ist konkret.** sitemap.xml-Detection muss zwischen statischen und dynamischen Sites unterscheiden. llms.txt-Format-Änderungen sind realistisch, weil der Standard nicht stabilisiert ist. Validierungs-Logik muss konservativ bleiben.

**Profil-System-Schuld ist offen.** Wir verwenden Profil 1–4 in ADR-029 ohne formale ADR-Definition. Das ist akzeptable Übergangs-Schuld, aber sie muss zeitnah aufgelöst werden.

### Folge-Aktionen

1. **Ansatz C im Backlog Severity prüfen und anheben.** Mit ADR-029 ist Ansatz C nicht mehr UX-Item, sondern Voraussetzung für Build von Kategorie 27. Severity-Anhebung von `should` auf `must` ist plausibel.
2. **ADR-030 zum Profil-System als zwingende Folge-ADR.** Vor Build-Start von Kategorie 27 muss das Profil-System formal definiert sein.
3. **Komitee-Wiederholung mit Opus-Judge sobald API stabil.** Run 2 lief mit Sonnet-Judge-Fallback. Für Robustheits-Validierung der Konvergenz wäre eine Wiederholung mit Opus-Judge wertvoll — kein Blocker, Backlog-Item für Phase 2.

---

## Status

**Status: accepted**, gesetzt am 2026-05-08. Die hohe Komitee-Konvergenz über drei Runs (Run 1, Run 2, Followup) trägt die Setzung. Der Sonnet-Judge-Fallback in Run 2 ist methodisch dokumentiert, mit empfohlener Opus-Wiederholung als Folge-Aktion.

**review_by: 2027-05-08**, ein Jahr nach Annahme. Dieses Datum ist bewusst auf 12 Monate gesetzt — abweichend von ADR-028 (90 Tage). Die zentrale Wette der ADR (AI-Readiness ist nachhaltig) braucht ein Beobachtungs-Fenster, das einer kurzfristigen Stabilitäts-Prüfung nicht zugänglich ist. Der review_by-Termin fällt parallel zur Wette-Falsifikations-Periode, sodass beide Themen am selben Datum überprüft werden.

**Disziplin-Hinweis.** Kategorie 27 ist nicht erste, nicht letzte. Die Audit-Engine wird sich strukturell weiterentwickeln, und profil-gebundene Regeln sind Vorlage für künftige Kategorien. Wer eine 28. Kategorie konzipiert, orientiert sich an der hier gesetzten Profil-Bindungs-Architektur — nicht am UI-Detail oder am Komitee-Format, sondern am strukturellen Konzept "Regeln sind kontextgebunden, Audit ist nicht eine Universal-Wahrheit".
