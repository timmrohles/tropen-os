# Committee Review: ai-discoverability-followup

> Generiert am 2026-05-08 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# AI-Discoverability Followup — Synthese

## Konsens Frage 1 — Reihenfolge Profil 3

**EINIG** auf den ersten drei Positionen:
1. **OpenGraph** (alle 4 Modelle) — höchster user-sichtbarer Schmerz
2. **robots.txt** (alle 4 Modelle) — essentiell für Crawler-Kontrolle
3. **sitemap.xml** (alle 4 Modelle) — SEO-Grundlage

**MEHRHEIT** bei den hinteren Positionen:
- JSON-LD meist Position 4, llms.txt Position 5
- Canonical URLs wird nur von 2 Modellen erwähnt (unterschiedliche Positionen)

Das Muster "sichtbarer Business-Schmerz vor technischer Eleganz" ist durchgängig erkennbar.

## Konsens Profile 2 und 4

**Profil 2:** **EINIG** — nur robots.txt implementieren, sofortige Priorität wegen Crawler-Exposition bei internen Tools.

**Profil 4:** **MEHRHEIT** empfiehlt alle Regeln von Profil 3 plus Canonical URLs, meist nach sitemap.xml eingefügt wegen Multi-Domain-SEO-Anforderungen.

## Konsens Frage 2 — llms.txt-Trigger

**MEHRHEIT** für Option C (Hybrid):
- 2 explizit für C, 1 für B (nah an C), 1 erwähnt beide Aspekte
- Begründung: Existenz-Check als sanfte Info, Format-Check für Qualitätssicherung
- Balanciert Sensibilisierung ohne Spam-Gefühl

Risiko-Konsens: False-Positives bei sich änderndem Standard, False-Negatives bei ignorierter Info.

## Drei Implikationen für ADR-029

1. **Feste Reihenfolge in Profil 3:** OpenGraph → robots.txt → sitemap.xml → JSON-LD → llms.txt verankern
2. **llms.txt-Hybrid-Trigger:** Existenz-Check als Low-Info + Format-Check als Medium-Should implementieren
3. **Profil-Bindung strikt halten:** Canonical nur in Profil 4, kein Feature-Creep in niedrigere Profile

## Mein Founder-Rat

Empfehlungen sind tragfähig. Die Konvergenz auf "Business-Impact first" ist solide, und der Hybrid-Ansatz für llms.txt vermeidet sowohl Spam- als auch Ignoranz-Fallen. Einzig zu beachten: Regelmäßige llms.txt-Standard-Updates einplanen.

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    5385 |     879 | €0.0273 |
| GPT-4o           |    3951 |     442 | €0.0133 |
| Gemini 2.5 Pro   |    4248 |    2044 | €0.0239 |
| Grok 4           |    4816 |    1891 | €0.0398 |
| Judge (Opus)     |    3326 |     703 | €0.0954 |
| **Gesamt**       |         |         | **€0.1998** |
