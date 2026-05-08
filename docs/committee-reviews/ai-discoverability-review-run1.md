# Committee Review: ai-discoverability

> Generiert am 2026-05-08 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

## FRAGE 1 — REGELAUSWAHL

### Kandidat A — robots.txt
**Konsens-Level:** EINIG  
**Aufnehmen:** Ja | **Gewicht:** 2-3 | **Severity:** high  
Alle Modelle sehen robots.txt als essentiell für Crawler-Kontrolle.

### Kandidat B — llms.txt  
**Konsens-Level:** EINIG  
**Aufnehmen:** Ja | **Gewicht:** 1 | **Severity:** low  
Alle erkennen das Potenzial des emerging Standards für AI-Discovery.

### Kandidat C — OpenGraph / Meta-Tags
**Konsens-Level:** EINIG  
**Aufnehmen:** Ja | **Gewicht:** 2 | **Severity:** medium  
Konsens: Kritisch für professionelles Social Sharing.

### Kandidat D — sitemap.xml
**Konsens-Level:** EINIG  
**Aufnehmen:** Ja | **Gewicht:** 2 | **Severity:** medium  
Alle Modelle betonen Wichtigkeit für strukturierte Indexierung.

### Kandidat E — Canonical URLs
**Konsens-Level:** GESPALTEN  
**Aufnehmen:** 2x Nein, 2x Ja | **Gewicht:** 1-2 | **Severity:** low  
**Spaltung:** Claude/Sonnet: "zu nischig für Vibe-Coder" vs. GPT-4O/Grok: "wichtig für Duplicate-Content"

### Kandidat F — Structured Data / JSON-LD
**Konsens-Level:** GESPALTEN  
**Aufnehmen:** 2x Nein, 2x Ja | **Gewicht:** 2-3 | **Severity:** medium-high  
**Spaltung:** Claude/Sonnet: "zu komplex" vs. GPT-4O/Grok: "erhöht AI-Verständnis"

**Priorisierte Implementierungs-Reihenfolge:**
1. robots.txt (höchste Einigkeit & Severity)
2. OpenGraph / Meta-Tags (Business-kritisch)
3. sitemap.xml (SEO-wichtig)
4. llms.txt (Zukunftsinvestition)

## FRAGE 2 — LLMS.TXT TIMING

**Konsens-Level:** MEHRHEIT  
**Empfehlung:** Option II — Als `advisory` flaggen  
3 von 4 Modellen empfehlen advisory-Ansatz. Vibe-Coder werden sensibilisiert ohne Score-Druck, da Standard noch instabil ist.

**Getrennte Behandlung von robots.txt:** EINIG — Ja  
robots.txt ist etabliert (voller Score-Impact), llms.txt experimentell (kein Score-Impact).

## FRAGE 3 — SCOPE

**Konsens-Level:** GESPALTEN  
**Profil-Bindung:** 2x Ja (ab Profil 3), 2x Nein (pauschal mit angepasster Severity)

**Mehrheitsempfehlung:** Profil-gebundene Aktivierung ab Profil 3 (Team/Production)  
Bei niedrigeren Profilen: robots.txt mit angepasster Severity (high für interne Tools)

## FRAGE 4 — IMPLEMENTIERUNG

### robots.txt
**Empfohlener Ansatz:** Datei-Existenz + Regex für `User-agent:` und `Disallow:` Zeilen. Ignoriere Kommentare und Leerzeilen.  
**False-Positive-Falle:** Leere Datei oder nur Kommentare ohne echte Direktiven.

### OpenGraph / Meta-Tags  
**Empfohlener Ansatz:** Dual-Path: Prüfe `metadata` Export in layout.tsx UND Meta-Tags via Regex. Mindestens og:title + og:description erforderlich.  
**False-Positive-Falle:** Tags existieren aber mit leeren Werten.

### sitemap.xml
**Empfohlener Ansatz:** Multi-Detection: public/sitemap.xml ODER app/sitemap.ts ODER Referenz in robots.txt.  
**False-Positive-Falle:** Dynamische Generierung via sitemap.ts wird bei reinem File-Check übersehen.

### llms.txt
**Empfohlener Ansatz:** Reine Datei-Existenz in public/, minimale Inhaltsvalidierung da Standard instabil.  
**False-Positive-Falle:** Datei existiert aber mit falschem/leerem Format.

## ZUSAMMENFASSUNG FÜR TIMM

### Finale Regelübersicht

| Regel | Aufnehmen | Gewicht | Severity | Profil-Bedingung |
|-------|-----------|---------|----------|------------------|
| robots.txt | ✅ | 3 | high | Alle Profile (angepasste Severity) |
| OpenGraph | ✅ | 2 | medium | Ab Profil 3 |
| sitemap.xml | ✅ | 2 | medium | Ab Profil 3 |
| llms.txt | ✅ | 1 | low (advisory) | Ab Profil 3 |
| Canonical URLs | ❓ | 1 | low | Timm entscheidet |
| JSON-LD | ❓ | 2 | medium | Timm entscheidet |

### Offene Entscheidungen für Timm

1. **Canonical URLs aufnehmen?** Spaltung: Zu nischig vs. wichtig für SEO-Hygiene
2. **JSON-LD aufnehmen?** Spaltung: Zu komplex vs. AI-Readiness-Vorteil
3. **Exakte Profil-Bindung:** Strikt ab Profil 3 oder flexibler mit angepasster Severity?

### Nächste Schritte

1. **Sofort:** robots.txt Checker implementieren (Konsens + höchste Priority)
2. **Bald:** OpenGraph und sitemap.xml Checker (Business-kritisch für B2C)
3. **Später:** llms.txt als advisory Feature (Zukunftsinvestition ohne Druck)

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    4227 |    1325 | €0.0303 |
| GPT-4o           |    3214 |     736 | €0.0143 |
| Gemini 2.5 Pro   |    3627 |    2043 | €0.0232 |
| Grok 4           |    3974 |    2710 | €0.0489 |
| Judge (Opus)     |    5785 |    1623 | €0.1939 |
| **Gesamt**       |         |         | **€0.3106** |
