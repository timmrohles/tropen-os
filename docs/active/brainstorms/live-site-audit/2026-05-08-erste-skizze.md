---
status: draft
updated: 2026-05-08
review_by: 2026-06-08
supersedes: []
---

# Live-Site-Audit via Browser-Inspektion — erste Skizze

## Auslöser

Im Sparring vom 2026-05-08: Claude hat im Browser die Tropen-Website live angesehen und Dinge bemerkt, die der Founder selbst nicht gesehen hatte. Andere Erkenntnis-Klasse als heutiger Repo-Scan — der Output wird direkt geprüft, nicht der Code, der ihn erzeugt.

## Was die Idee ist

Eine neue Audit-Methode neben dem Repo-Scan: Tropen prüft die **gerenderte Live-Site** direkt im Browser. Möglicherweise per AI-Vision (Screenshot-Analyse), möglicherweise per Headless-Browser mit DOM-Inspektion, möglicherweise hybride Variante.

## Warum interessant

Tropens 26+1 Audit-Kategorien arbeiten alle am Repo. Lighthouse läuft gegen URL, aber nur mit Performance-Metriken. Der menschliche/AI-Blick auf die Live-Site ist eine Lücke. Das, was der User wirklich sieht, kann vom Code-Stand abweichen — durch Build-Pipeline-Eigenheiten, Caching, dynamische Inhalte, Cookie-Banner, Third-Party-Skripte.

Vier Verhaltensklassen, die ein Live-Site-Audit erfasst:
- **UX-Anomalien**, die im Code nicht auffallen (Layout-Brüche, schlechte Hierarchie, mobile Skalierung)
- **Wirkungs-Schicht** (sieht die Marke konsistent aus, wirkt der CTA, ist die Hierarchie lesbar)
- **AI-Crawler-Sicht** (was sieht GPTBot, was sieht ein User, der über AI-Antwort kommt)
- **Compliance-Sicht** (Cookie-Banner-Verhalten im Browser, Impressum-Erreichbarkeit, tatsächlich gesetzte Cookies)

## Methodische Kernfrage (offen)

**Wie prüft Tropen-Audit eine Live-Site automatisiert?**

Vier mögliche Ansätze:
1. **Headless-Browser plus regelbasierte DOM-Checks** — deterministisch, aber begrenzt auf strukturelle Prüfungen
2. **Screenshot plus AI-Vision-Modell** — erfasst Wirkungs-Schicht, kostet Komitee-Calls pro Audit-Run
3. **Hybrid** — Headless für Strukturelles, AI-Vision für Wirkungs-Schicht
4. **AI-Crawler-Simulation** — prüft, was GPTBot, anthropic-ai etc. tatsächlich sehen

Vor Phase-2-Reife: methodische Klärung nötig. Eines der Hindernisse: Live-Site-Audit verlangt URL und Zugang, was in der Tropen-Web-Architektur (File System Access API als heutiger Eintritt) eine neue Eintritts-Form wäre.

## Wo gehört es konzeptionell hin

Erste Einschätzung — eher **Use-Case-Erweiterung** als neue Audit-Kategorie. Tropen hat bereits Audit-Findings — Browser-Inspektion fügt eine neue **Erkenntnis-Quelle** hinzu, nicht eine neue Regel-Klasse. Gefundene Probleme würden in bestehende Kategorien einsortiert (UX → Accessibility, Layout → Design-System, AI-Crawler-Render → Kategorie 27).

Mögliche Anker-Punkte:
- v3 Achse 7 (Regelwerk Use-Cases) als 5. Use-Case "Live-Site-Inspektion"
- Erweiterung Kategorie 27 (Web-Discoverability bekommt rendered-view-Dimension)
- Eigene neue Audit-Methode innerhalb der Engine, kategorie-übergreifend

## Hypothese zur Use-Klasse

Doppelte Klassen-Zugehörigkeit:
- **Klasse A (Tropen-eigene Disziplin):** Tropen sollte selbst die Tropen-Site so prüfen, bevor Beta-User die Plattform nutzen. Live-Site-Audit der eigenen Site als Vor-Beta-Routine.
- **Klasse C (User-Feature):** Wenn die Methodik trägt, ist das ein neues Audit-Werkzeug, das User über Tropen-Plattform aufrufen können.

## Was zu klären ist (vor Phase-2-Aufnahme)

1. Welcher der vier methodischen Ansätze ist machbar in Tropen-Architektur?
2. Wie hoch sind Komitee-/Vision-Modell-Kosten pro Audit-Run?
3. Welche False-Positive-Risiken hat AI-Vision-Audit (z.B. "Layout-Bruch" als Subjektivität)?
4. Wo im Produkt wird Live-Site-Audit eingestiegen — als eigener Eintritt neben File System Access API, oder als Folge-Aktion nach Repo-Audit?

## Ablöse-Ziel

Wenn diese Brainstorm-Skizze reift: zu einer normativen Datei in `docs/active/` (z.B. `live-site-audit-konzept.md`) plus klar definiertem Backlog-Item in Phase 2. Bis dahin bleibt die Idee Roh-Material.

## Verknüpfung

- Backlog-Anker: siehe `docs/active/backlog.md` Phase-2-Features
- Verwandte Themen: Kategorie 27 (Web-Discoverability), Achse 7 (Regelwerk-Use-Cases), Achse 5 (Begleiter-Chat — Live-Site-Findings könnten dort proaktiv landen)
