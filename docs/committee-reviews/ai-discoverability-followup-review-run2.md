# Committee Review: ai-discoverability-followup

> Generiert am 2026-05-08 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# AI-Discoverability Followup — Synthese

## Konsens Frage 1 — Reihenfolge Profil 3

**Konsens-Level: MEHRHEIT**

**Stabile Top-3:**
1. **OpenGraph** (4/4 Modelle) — Höchster user-sichtbarer Impact durch Social Media Sharing
2. **robots.txt** (4/4 Modelle) — Kritische Crawler-Kontrolle, einfache Implementierung
3. **sitemap.xml** (3/4 Modelle) — SEO-Foundation mit mittlerem Aufwand

**Umstrittene Positionen 4-6:**
- **JSON-LD** schwankt zwischen Position 4-5 (moderate AI-Readiness-Vorteile)
- **Canonical** zwischen Position 5-6 (niedriger Schmerz für Standard-SPAs)
- **llms.txt** mehrheitlich Position 6 (experimentell, advisory-only)

## Konsens Profile 2 und 4

**Profil 2:** Einheitlich — nur robots.txt implementieren, sofortige Priorität für interne Tool-Kontrolle mit "Disallow: /".

**Profil 4:** Canonical rückt auf Position 4 vor (nach sitemap.xml), da Multi-Domain-Szenarien echte Duplicate-Content-Probleme haben und SEO-Hygiene kritischer wird.

## Konsens Frage 2 — llms.txt-Trigger

**Konsens-Level: GESPALTEN**

**Empfehlungen:** 1x Option B (Format-Check nur bei Vorhandensein), 2x Option C (Hybrid), 1x unvollständig

**Mehrheits-Logik für Hybrid (C):** 
- Sanfte Bewusstseinsschaffung ohne Spam-Gefühl
- Qualitätsfeedback bei vorhandenen Implementierungen
- Respektiert Opt-in-Natur des experimentellen Standards

## Drei Implikationen für ADR-029

1. **Profil-spezifische Reihenfolgen festschreiben:** Top-3 (OpenGraph → robots.txt → sitemap.xml) für Profil 3 sind consensus-ready. Position 4-6 brauchen Tie-Breaking-Kriterien.

2. **llms.txt-Trigger definieren:** Hybrid-Ansatz (Info bei Nicht-Vorhandensein, Should-Level bei Format-Fehlern) als Standard verankern, mit Fallback auf Format-Check-only.

3. **False-Positive-Risiko dokumentieren:** Besonders bei sitemap.xml (statisch vs. dynamisch) und schnellen llms.txt-Format-Änderungen. Validierungslogik muss konservativ bleiben.

## Mein Founder-Rat

**Empfehlungen sind tragfähig.** Die OpenGraph-robots.txt-sitemap.xml-Sequenz ist solid und business-validated. Hybrid llms.txt-Trigger ist ein vernünftiger Kompromiss zwischen Innovation und Vorsicht für Vibe-Coder-Adoption.

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    5385 |     813 | €0.0264 |
| GPT-4o           |    3951 |     457 | €0.0134 |
| Gemini 2.5 Pro   |    4248 |    2044 | €0.0239 |
| Grok 4           |    4816 |    2003 | €0.0414 |
| Judge (Opus)     |    3290 |     804 | €0.1020 |
| **Gesamt**       |         |         | **€0.2071** |
