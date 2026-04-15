# Committee Review: automated-testbench

> Generiert am 2026-04-14 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Konsens-Bericht: Automatisierte Checker-Testbench

## 1. Technische Machbarkeit

**Konsens-Level: EINIG**

**Empfohlene Option:** In-memory via GitHub API mit Tarball-Optimierung

**Nächster Schritt:** Node.js Script mit Octokit, das Tarball-API nutzt (1 Call/Repo statt 100+)

```javascript
// Einheitlich empfohlener Ansatz
const tarballUrl = `https://api.github.com/repos/${owner}/${repo}/tarball`;
const files = await extractTarballToFileMap(buffer);
```

## 2. GitHub API Rate Limits

**Konsens-Level: EINIG**

**Empfohlene Option:** Tarball-Download (1 API Call pro Repo)

**Nächster Schritt:** `tar-stream` Package für In-Memory-Extraktion implementieren

Alle Modelle bestätigen: 
- Tarball: 5.000 Repos/Stunde möglich
- File-by-file: nur 50 Repos/Stunde
- Git clone: Rate-limit-frei, aber unpraktisch für Solo-Founder

## 3. Welche Repos auswählen

**Konsens-Level: EINIG**

**Empfohlene Filter:**
- Mindestens 10 TypeScript/TSX-Dateien
- `package.json` mit React/Next.js/Vite
- Letzter Commit < 6 Monate
- Nicht archiviert

**Nächster Schritt:** GitHub Search Query: 
```
topic:lovable-dev language:TypeScript pushed:>2024-01-01
```

## 4. Ergebnisse speichern und auswerten

**Konsens-Level: MEHRHEIT**

**Empfohlene Option:** Bestehende Supabase DB erweitern (3 von 4 Modellen)

**Nächster Schritt:** Flag `is_benchmark: true` in bestehende `audit_runs` Tabelle

Claude empfiehlt separate Tabellen, aber Mehrheit sieht das als Over-Engineering.

## 5. Timing

**Konsens-Level: EINIG**

**Empfohlene Option:** JETZT starten

**Nächster Schritt:** 2-Tage MVP mit 10 Repos

Begründung aller Modelle: "Checker-Qualität ist dein Hauptrisiko"

## 6. Content-Strategie

**Konsens-Level: EINIG**

**Empfohlene Option:** Nur aggregierte Statistiken, keine Repo-Namen

**Nächster Schritt:** Content-Templates vorbereiten:
- "94% der KI-generierten Apps haben DSGVO-Lücken"
- "Top 5 Vibe-Coder Fehler..."

## 7. Aufwand

**Konsens-Level: EINIG**

**MVP:** 2-3 Tage (16-24 Stunden)
**Production:** 1-2 Wochen
**Vollautomatisiert:** 3-4 Wochen (nicht empfohlen)

---

## Architektur-Konsens

**Gewinner-Design:** Node.js Script mit GitHub API + Tarball

```
INPUT:
- GitHub Token
- Repo-Filter (topic:lovable-dev)
- Max 10 Repos für MVP

PROCESSING:
1. GitHub Search API → Repo-Liste
2. Für jedes Repo:
   - Tarball Download (1 API Call)
   - In-Memory Extraction
   - generateRepoMapFromFiles()
   - runAllAgents()
3. Ergebnisse → Supabase

OUTPUT:
- audit_runs mit is_benchmark flag
- FP-Rate pro Regel
- Aggregierte Statistiken
```

**Geschätzter MVP-Aufwand:** 16 Stunden

---

## Warnungen

### Over-Engineering-Risiko
**EINIG:** Keine GitHub Actions, keine separaten DBs, kein Vollautomatismus im MVP

### Ethische Fallstricke
**EINIG:** Nur öffentliche Repos, keine Namen in Marketing, nur Aggregate

### Rate-Limit-Probleme
**EINIG:** Tarball-Ansatz löst das Problem (5.000 Repos/h möglich)

---

## Nächste Schritte

1. **Tarball-Extraction implementieren** (4h)
   - `tar-stream` Package einbinden
   - In-Memory File-Map erstellen

2. **Repo-Discovery-Script** (2h)
   - GitHub Search mit Filtern
   - 10 relevante Repos auswählen

3. **Benchmark-Flag in DB** (1h)
   - `is_benchmark` zu audit_runs
   - Query für FP-Rate vorbereiten

4. **Ersten Scan durchführen** (2h)
   - 10 Repos scannen
   - Manuelle FP-Bewertung

5. **Landing-Page-Content** (2h)
   - Erste Statistiken extrahieren
   - "94% haben DSGVO-Lücken" etc.

**Total: 11 Stunden** — machbar in 2 fokussierten Tagen.

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    4932 |    2048 | €0.0423 |
| GPT-4o           |    3733 |     613 | €0.0144 |
| Gemini 2.5 Pro   |    4140 |    2044 | €0.0238 |
| Grok 4           |    4529 |    2474 | €0.0471 |
| Judge (Opus)     |    6235 |    1365 | €0.1822 |
| **Gesamt**       |         |         | **€0.3099** |
