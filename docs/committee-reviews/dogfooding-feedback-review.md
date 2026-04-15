# Committee Review: dogfooding-feedback

> Generiert am 2026-04-14 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

## Konsens-Analyse: Dogfooding-Feedback-Strategie

### Frage 1: Wie formalisieren wir das Dogfooding-Feedback?

**Konsens-Level:** EINIG

**Empfohlene Option:** Hybrid aus C (GitHub Issues) + A (Markdown-Log)

**Nächster Schritt:** 
- GitHub Issue Template mit Labels "checker-quality" und "false-positive" erstellen (15 Min)
- `docs/checker-feedback.md` anlegen mit Struktur: Datum | Regel-ID | Problem | Fix | Impact (30 Min)

### Frage 2: Ab wann lohnt sich ein automatisches System?

**Konsens-Level:** EINIG

**Empfohlene Option:** B - Nach 10 Beta-Usern

**Nächster Schritt:**
- Jetzt nichts automatisieren - manuelles Tracking reicht
- Bei User #10: Simple Supabase-Tabelle für Feedback-Events planen

### Frage 3: "Unser Pattern" vs. "Universelles Problem"?

**Konsens-Level:** EINIG

**Empfohlene Option:** Hybrid aus A (Testen gegen Open-Source-Repos) + C (Stack-Detection)

**Nächster Schritt:**
- 3-5 Referenz-Repos definieren: Next.js Starter, T3 Stack, Supabase Template (1h)
- Minimale Stack-Detection in Scanner: `detectStack()` aus package.json (2h)

### Frage 4: False-Positive-Rate - Was ist akzeptabel?

**Konsens-Level:** EINIG

**Empfohlene Option:** B - <10% für MVP, <5% nach Year 1

**Nächster Schritt:**
- Pro Regel FP-Rate tracken in checker-feedback.md
- Regeln mit >10% FP sofort fixen oder deaktivieren

### Frage 5: "Finding falsch?"-Button im Produkt?

**Konsens-Level:** EINIG

**Empfohlene Option:** Ja, aber erst in Beta-Phase

**Nächster Schritt:**
- Jetzt: UI-Mockup erstellen, aber NICHT implementieren
- Beta: Minimaler Button mit Supabase-Integration (4h Aufwand)

### Frage 6: Checker-Qualität als Wettbewerbsvorteil?

**Konsens-Level:** MEHRHEIT

**Empfohlene Option:** 60% B (Bestehende verfeinern) + 40% D (EU-Compliance)

**Nächster Schritt:**
- Wöchentlich: Die Regel mit höchster FP-Rate verbessern
- Monatlich: Eine neue EU-spezifische Regel (DSGVO/AI Act)

## KERNENTSCHEIDUNG

### Was tun wir JETZT (diese Woche)?
1. GitHub Issue Template + Markdown-Log einrichten (45 Min)
2. Top 3 False-Positive-Regeln identifizieren und fixen (8h)
3. 5 Open-Source-Repos als Testbench definieren (1h)

### Was tun wir bei BETA-START?
1. "Finding falsch?"-Button implementieren (4h)
2. Stack-Detection aktivieren für Next.js/Supabase/Prisma
3. Wöchentliche Feedback-Review-Routine etablieren

### Was tun wir bei PMF?
1. Automatisierte Regel-Performance-Reports
2. Community-Features für Custom Rules
3. ML-basierte Pattern Recognition evaluieren

## WARNUNGEN

### Over-Engineering für Solo-Founder:
- ❌ Eigene DB-Infrastruktur für Feedback (Option B in Frage 1)
- ❌ Community-Features vor 100 Usern
- ❌ Automatisierung vor externen Nutzern
- ❌ Komplexe Konfigurationsoptionen

### Später bereuen wenn nicht von Anfang an:
- ✅ Strukturiertes Feedback-Tracking (GitHub Issues)
- ✅ FP-Rate Messung pro Regel
- ✅ Testing gegen externe Repos
- ✅ Datensammlung via "Falsch?"-Button (ab Beta)

### Minimaler Aufwand für maximalen Lerneffekt:
- GitHub Issues = Zero Setup, maximale Integration
- Markdown-Log = Durchsuchbar, versioniert, keine DB
- 3-5 Test-Repos = Breite Abdeckung ohne Overhead

## PRIORISIERTE TODO-LISTE

1. **GitHub Issue Template erstellen** (15 Min, Impact: Hoch)
   - Labels: "checker-quality", "false-positive", "security", "performance"
   - Template-Felder: Regel-ID | False Positive | Root Cause | Fix

2. **Logger False Positive fixen** (2h, Impact: Kritisch)
   - Negative Lookahead für `createLogger()` Pattern
   - Test gegen Next.js + Supabase Templates

3. **Test-Repos definieren & ersten Test-Run** (1.5h, Impact: Hoch)
   - Next.js Commerce, T3 Turbo, Supabase Auth Example
   - Aktuelle FP-Rate dokumentieren

4. **checker-feedback.md anlegen** (30 Min, Impact: Mittel)
   - Struktur: Datum | Regel | FP-Rate | Fix | GitHub Issue

5. **Top 3 FP-Regeln identifizieren** (1h, Impact: Hoch)
   - Security-Checker durchgehen
   - Performance-Regeln prüfen
   - Priorisierung nach User-Impact

## Nächste Schritte

**Sofort (nächste 48h):** GitHub Setup + Logger-Fix + Test-Repos  
**Diese Woche:** Alle 5 TODOs abarbeiten  
**Nächste Woche:** Erste Regel-Verbesserungen basierend auf Test-Runs  
**Vor Beta:** Stack-Detection Prototyp, UI-Mockup für Feedback-Button

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    5292 |    1994 | €0.0426 |
| GPT-4o           |    3852 |     610 | €0.0146 |
| Gemini 2.5 Pro   |    4257 |    2044 | €0.0240 |
| Grok 4           |    4734 |    2629 | €0.0499 |
| Judge (Opus)     |    6075 |    1581 | €0.1950 |
| **Gesamt**       |         |         | **€0.3261** |
