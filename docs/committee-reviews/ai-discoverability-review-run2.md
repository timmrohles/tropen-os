# Committee Review: ai-discoverability

> Generiert am 2026-05-08 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Konsens-Bericht: Kategorie 27 — Web Discoverability & AI Readiness

## FRAGE 1 — REGELAUSWAHL

### Kandidat A — robots.txt
**Konsens-Level:** EINIG  
**Aufnehmen:** Ja | **Gewicht:** 2-3 | **Severity:** medium-high  
Alle Modelle stimmen überein: Essentiell für Crawler-Kontrolle und AI-Readiness.

### Kandidat B — llms.txt  
**Konsens-Level:** EINIG  
**Aufnehmen:** Ja | **Gewicht:** 1 | **Severity:** low  
Einstimmig als experimenteller, aber wertvoller Early-Adopter-Vorteil gesehen.

### Kandidat C — OpenGraph / Meta-Tags
**Konsens-Level:** EINIG  
**Aufnehmen:** Ja | **Gewicht:** 2-3 | **Severity:** medium-high  
"Ohne OG-Tags sehen deine App-Links auf Social Media aus wie Spam" — kritisch für Discoverability.

### Kandidat D — sitemap.xml
**Konsens-Level:** EINIG  
**Aufnehmen:** Ja | **Gewicht:** 2-3 | **Severity:** medium-high  
Strukturierte Indexierung für Suchmaschinen und AI-Crawler.

### Kandidat E — Canonical URLs
**Konsens-Level:** GESPALTEN  
**Aufnehmen:** Unentschieden | **Gewicht:** 1-2 | **Severity:** low-medium  
- **Pro:** Verhindert Duplicate-Content-Probleme (GPT-4o, Grok)
- **Contra:** Zu technisch für Vibe-Coder, SPAs haben oft keine Canonical-Problematik (Claude)

### Kandidat F — Structured Data / JSON-LD
**Konsens-Level:** GESPALTEN  
**Aufnehmen:** Unentschieden | **Gewicht:** 2 | **Severity:** medium  
- **Pro:** Reichhaltige Snippets, AI-Kontext-Verbesserung (GPT-4o, Grok)  
- **Contra:** Schema.org zu komplex, Overkill für B2C-Apps (Claude)

### Priorisierte Implementierungs-Reihenfolge
1. **OpenGraph** — Höchster Business-Impact
2. **robots.txt** — Grundschutz vor ungewollter Exposition  
3. **sitemap.xml** — SEO-Foundation
4. **llms.txt** — Future-Proofing

## FRAGE 2 — LLMS.TXT TIMING

**Konsens-Level:** MEHRHEIT  
**Empfehlung:** Option II — Als `advisory` aufnehmen  
Der Checker zeigt Findings ohne Score-Impact, bis der Standard stabilisiert ist. Ermöglicht Early-Adopter-Vorteile ohne Risiko bei Format-Änderungen.

**Getrennte Behandlung von robots.txt:** Ja  
Einstimmig: robots.txt ist etabliert (direkte Implementierung), llms.txt bleibt experimentell (advisory).

## FRAGE 3 — SCOPE

**Konsens-Level:** MEHRHEIT  
**Profil-Bindung:** Ja, ab Profil ≥ 3  

Die Mehrheit empfiehlt Profil-Bindung mit Anpassungen:
- **Interne Tools (Profil 2):** Nur robots.txt relevant (zum Blockieren)
- **Public B2C-Apps (Profil 3+):** Alle Regeln aktiv
- **Demo/Solo-Tools (Profil 1):** Kategorie inaktiv

Alternative von Claude: Pauschale Aktivierung mit Severity-Anpassung nach Profil wurde von der Mehrheit verworfen.

## FRAGE 4 — IMPLEMENTIERUNG

### robots.txt
**Prüfansatz:** Datei-Existenz in `public/` plus Inhaltsprüfung via Regex auf `User-agent:` und mindestens eine Direktive (`Disallow:`/`Allow:`). Mindestens 2 Direktiven für validen Status.  
**False-Positive-Falle:** Leere oder nur-Kommentar-Dateien als "vorhanden" werten.

### llms.txt
**Prüfansatz:** Existenz-Check in `public/` reicht initial, da Format noch instabil. Optional: Basis-Format-Check auf Name/Description-Zeilen.  
**False-Positive-Falle:** Zu strenge Format-Validierung bei sich änderndem Standard.

### OpenGraph
**Prüfansatz:** Dual-Check in `app/layout.tsx`: Next.js `metadata`-Export mit OG-Properties ODER JSX `<meta>`-Tags. Alle drei Core-Tags (title/description/image) müssen vorhanden sein.  
**False-Positive-Falle:** Partielle OG-Implementierung (nur title) als vollständig werten.

### sitemap.xml
**Prüfansatz:** Check auf `public/sitemap.xml` ODER `app/sitemap.ts` für dynamische Generierung. Bei Existenz optional Verweis in robots.txt prüfen.  
**False-Positive-Falle:** Leere/invalide XML-Datei als funktional werten.

## ZUSAMMENFASSUNG FÜR TIMM

### Finale Regelübersicht

| Regel | Aufnehmen | Gewicht | Severity | Profil-Bedingung |
|-------|-----------|---------|----------|------------------|
| robots.txt | Ja | 3 | high | ≥ 2 (medium für Profil 2) |
| llms.txt | Ja (advisory) | 1 | low | ≥ 3 |
| OpenGraph | Ja | 3 | high | ≥ 3 |
| sitemap.xml | Ja | 2 | medium | ≥ 3 |
| Canonical URLs | **Offen** | 1-2 | low-medium | ≥ 3 |
| JSON-LD | **Offen** | 2 | medium | ≥ 3 |

### Offene Entscheidungen für Timm

1. **Canonical URLs aufnehmen?** Spaltung zwischen "zu technisch für Vibe-Coder" vs. "wichtig für Duplicate-Content"
2. **JSON-LD/Structured Data aufnehmen?** Spaltung zwischen "Overkill" vs. "moderne AI-Discoverability"  
3. **robots.txt Severity:** high (Grok/GPT-4o) oder medium (Claude)? Impact auf Priorisierung

### Nächste Schritte

1. **Sofort:** OpenGraph-Checker implementieren — höchster Business-Impact, klarer Konsens
2. **Bald:** robots.txt und sitemap.xml — etablierte Standards mit klaren Implementierungswegen
3. **Später:** llms.txt als advisory — Monitoring der Standard-Entwicklung einplanen

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    4227 |    1320 | €0.0302 |
| GPT-4o           |    3214 |     829 | €0.0152 |
| Gemini 2.5 Pro   |    3627 |    2044 | €0.0232 |
| Grok 4           |    3974 |    2691 | €0.0486 |
| Judge (Opus)     |    5892 |    1849 | €0.2112 |
| **Gesamt**       |         |         | **€0.3284** |
