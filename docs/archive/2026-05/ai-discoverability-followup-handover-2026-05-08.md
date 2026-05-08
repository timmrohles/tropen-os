---
status: archived
updated: 2026-05-08
review_by: null
supersedes: []
---

# AI-Discoverability Followup — Hand-Over

## Status

Erfolgreich (mit Degradierung: Sonnet als Judge-Fallback)

## Output-Datei

`docs/audit-reports/ai-discoverability-followup-komitee-2026-05-08.md`

## Sprint-Daten

- Modelle: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 (Reviewer) + Claude Sonnet als Judge-Fallback
- Judge-Fallback-Grund: Claude Opus (`claude-opus-4-20250514`) hatte heute persistent Internal Server Error (alle Versuche fehlgeschlagen). Sonnet hat als Fallback-Judge saubere Synthese geliefert.
- Run 1: €0.1998
- Run 2: €0.2071
- Gesamt: €0.4069

## Konvergenz-Stand

- Frage 1 (Reihenfolge Profil 3): **hoch** — Top-3 (OpenGraph → robots.txt → sitemap.xml) in beiden Runs 4/4 stabil
- Frage 2 (llms.txt-Trigger): **mittel** — Hybrid-Ansatz C in beiden Runs Mehrheit, nicht Einigkeit

## Finales Ergebnis

### Profil 3 — Implementierungs-Reihenfolge

1. OpenGraph — höchster Business-Impact, sofort sichtbar
2. robots.txt — Crawler-Kontrolle, einfachste Implementierung
3. sitemap.xml — SEO-Foundation
4. JSON-LD — AI-Readiness-Wette, mittlerer Aufwand
5. llms.txt — advisory, experimentell
6. Canonical — nur Profil 4 wirklich relevant

### Profil 2 — nur robots.txt (Disallow: / für interne Tools)

### Profil 4 — wie Profil 3, Canonical rückt auf Position 4 vor (Multi-Domain-SEO)

### llms.txt-Trigger — Option C (Hybrid)

- Existenz-Check: Finding feuert als `low/info` wenn keine llms.txt vorhanden
- Format-Check: Finding feuert als `medium/should` wenn llms.txt vorhanden aber Format inkorrekt
- Kein Score-Impact (advisory) bis Standard stabilisiert

## Empfehlung für nächsten Schritt

ADR-029 schreiben — alle sechs Regeln, Reihenfolge (OpenGraph → robots.txt → sitemap → JSON-LD → llms.txt → Canonical), llms.txt-Hybrid-Trigger, Profil-Bindung als verbindlich verankern.
