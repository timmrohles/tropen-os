# Repo Map Generator — Komitee-Review Input

## Was ist der Repo Map Generator?

Ein 6-Stufen-Pipeline-Tool das eine TypeScript/JavaScript-Codebase in eine kompakte, LLM-freundliche Repraesentation uebersetzt. Ziel: LLMs bekommen genug Kontext ueber die Codebase, ohne das Kontextfenster zu sprengen.

**Verwendung in Tropen OS:**
- Dogfooding: scannt die eigene Codebase (624 Dateien, 75K+ Zeilen, 2677 Symbole)
- Audit-System: liefert Codebase-Kontext fuer die Audit-Agenten
- Externe Projekte: `/audit/scan` nutzt `generateRepoMapFromFiles()` fuer Browser-basierte Scans
- Geplant: Kontext fuer Fix-Engine, MCP-Server, und intelligente Reviews

## Pipeline-Architektur

```
File Discovery → Parse + Extract → Reference Analysis → Graph Ranking → Compression → Formatting
```

### Stufe 1: File Discovery (`file-discovery.ts`)
- Rekursive Traversierung mit `.gitignore`-Respekt (via `ignore` Package)
- Default-Ignores: `node_modules`, `.next`, `.git`, `dist`, `build`, `coverage`
- Sprach-Filter: nur `.ts`, `.tsx`, `.js`, `.jsx`
- Include/Exclude-Patterns

### Stufe 2: Parse + Symbol-Extraktion (`parser.ts` + `symbol-extractor.ts`)
- TypeScript Compiler API (`ts.createSourceFile`) fuer AST-Parsing
- Extrahiert: Classes (mit Methoden/Properties), Functions, Interfaces, Types, Enums, Consts, Variables
- Signature-Building: Parameter + Return-Types, max 200 Zeichen
- Parent-Tracking: `MyClass.method` als `parentId`
- Export-Erkennung via `export`/`default` Modifier

### Stufe 3: Reference Analysis (`reference-analyzer.ts`)
- Baut Import-Graph aus `import`-Statements
- Nur relative (`./`, `../`) und Alias-Imports (`@/`) — externe Packages ignoriert
- Pfad-Resolution: Extensions (`.ts`/`.tsx`/`.js`/`.jsx`), Index-Files, `@/` → `src/`
- `referenceCount` wird pro importiertem Symbol inkrementiert
- Namespace-Imports (`import * as X`) zaehlen fuer alle Symbole

### Stufe 4: Graph Ranking (`graph-ranker.ts`)
- **File-Level:** PageRank auf Dependency-Graph (15 Iterationen, Damping 0.85)
- **Symbol-Level:** Multiplikative Faktoren:
  ```
  rankScore = fileRank * exportBonus * kindWeight * refBonus * entryPointBonus
  ```
  - `exportBonus`: 2.0 wenn exportiert
  - `kindWeight`: Class/Interface (1.0) > Type/Enum (0.9) > Function (0.8) > Const (0.7) > Method (0.6) > Variable (0.5) > Property (0.4)
  - `refBonus`: `1 + sqrt(referenceCount) * 0.5`
  - `entryPointBonus`: 2.0 fuer bekannte Entry-Points + API-Route-Handler
- Normalisierung auf 0-1

### Stufe 5: Map Compression (`map-compressor.ts`)
- Token-Budget Presets: small (2048), medium (4096), large (8192), auto (dynamisch nach Dateianzahl)
- Greedy-Algorithmus: Symbole nach rankScore sortiert, bis Budget voll
- Token-Schaetzung: `text.length / 4`

### Stufe 6: Formatierung (`formatters/`)
- **Text (Aider-Format):** Fuer LLM-Context — Datei-Header + `|` Prefix + Signatures
- **JSON:** Strukturierte Daten mit id, name, kind, signature, rankScore

## Aktuelle Metriken (Tropen OS, April 2026)

| Metrik | Wert |
|--------|------|
| Dateien gescannt | 624 |
| Symbole extrahiert | 2677 |
| Codezeilen | 75.257 |
| Inkludierte Symbole | 283 (bei 4096 Budget) |
| Generierungszeit | ~1.1 Sekunden |
| Top-Symbol | `createClient` (95 Referenzen, Score 0.19) |

## Bekannte Schwaechen (aus Calibration Review + Eigenanalyse)

### 1. Rank-Score Skalierung
- Scores konzentrieren sich im niedrigen Bereich (0.017-0.08 fuer die meisten Symbole)
- Max-Score 0.19 (createClient) — obwohl Normalisierung 0-1 sein soll
- Implikation: Relative Unterschiede schwer zu erkennen

### 2. Re-Export/Barrel-Files
- `export { foo } from '...'` wird NICHT erkannt
- Index-Barrel-Files (`index.ts` mit Re-Exports) werden nicht korrekt aufgeloest
- Implikation: Populaere Symbole die ueber Barrels exponiert werden, bekommen zu wenig referenceCount

### 3. Namespace-Imports
- `import * as X from '...'` inkrementiert referenceCount fuer ALLE Symbole des Ziels
- Implikation: Aufblaehung der Referenzzahlen bei Namespace-Imports

### 4. Path Resolution Fragilitaet
- `@/` Alias wird ueber String-Matching (`indexOf('/src/')`) aufgeloest — fragil bei verschachtelten Projekten
- `tsconfig.json` Path-Mappings werden nicht gelesen
- `findByAbsPath` nutzt Suffix-Matching — kann bei aehnlich benannten Dateien falsche Treffer liefern

### 5. Entry-Point Detection
- Hardcodierte Liste (8 Funktionsnamen) — verpasst projektspezifische Entry-Points
- API-Route-Detection nur via `/api/` im Pfad — verpasst andere Framework-Patterns

### 6. Token-Budget Unterausnutzung
- Greedy stoppt wenn naechstes Symbol Budget ueberschreiten wuerde
- Kein Backtracking oder Best-Fit — Budget wird nicht optimal genutzt
- File-Header-Overhead fix geschaetzt, nicht exakt

### 7. Fehlende Features
- Kein CommonJS-Support (`require()`)
- Kein Dynamic-Import-Support (`import()`)
- Keine `.mjs`/`.cjs` Erkennung (nur teilweise)
- Keine Sichtbarkeits-Filterung (interne APIs werden gleichbehandelt)
- Kein Support fuer andere Sprachen (Python, Go, Rust)
- Kein Caching/Memoization — jeder Run parst komplett neu

### 8. generateRepoMapFromFiles Einschraenkungen
- Kein Cross-File Reference Analysis (keine Disk-Reads bei Browser-Scan)
- Leere Dependencies → PageRank hat keinen Graph → alle Files gleich gerankt
- Implikation: Browser-basierte Scans produzieren deutlich schlechtere Rankings

## Bestehende Tests

- **Unit Tests:** 5 Test-Dateien (32+ Tests) fuer file-discovery, symbol-extractor, graph-ranker, reference-analyzer, map-compressor
- **Integration Test:** Full-Pipeline-Test mit Fixtures (circular-a/b, simple-class, utility, consumer)
- **Fixtures:** 5 Testdateien fuer verschiedene Szenarien

## Verwendungskontext

### CLI
```bash
npx tsx src/scripts/generate-repo-map.ts [--budget 4096]
```
Output: `docs/repo-map/tropen-os-map.json`, `.txt`, `-stats.json`

### Programmatisch
```typescript
// Disk-basiert (intern)
const map = await generateRepoMap({ rootPath, tokenBudget: 'auto' })

// In-Memory (externe Projekte via Browser)
const map = await generateRepoMapFromFiles(files, { tokenBudget: 'auto' })
```

### Integration in Audit-System
- `src/lib/audit/checkers/repo-map-checker.ts` nutzt die Repo Map fuer Symbol- und Struktur-Checks
- `buildAuditContext()` laedt die generierte Map als Kontext

## Vergleich mit Alternativen

| Tool | Ansatz | Staerke | Schwaeche |
|------|--------|---------|-----------|
| **Aider Repo Map** | ctags + tree-sitter + PageRank | Sprach-agnostisch, bewährt | Externe Dependencies (ctags, tree-sitter) |
| **Tropen OS Repo Map** | TypeScript Compiler API + PageRank | Zero-Dep (nur TS-Compiler), TS/JS-optimiert | Nur TS/JS, fragile Path Resolution |
| **GitHub Copilot Context** | Proprietaer | IDE-integriert | Closed Source, kein Self-Hosting |
| **Sourcegraph SCIP** | Language-Server-basiert | Praezise Referenzen | Schwergewichtig, Server noetig |

## Offene Fragen ans Komitee

1. **Skalierung:** Reicht die aktuelle Pipeline fuer 2000+ Dateien? Brauchen wir Parallelisierung oder Caching?
2. **Multi-Language:** Sollen wir Python/Go Support einbauen (fuer externe Projekte)? Oder bleibt TS/JS der Fokus?
3. **Browser-Scan Qualitaet:** Wie verbessern wir das Ranking bei `generateRepoMapFromFiles` ohne Disk-Zugriff?
4. **Re-Export-Handling:** Wie wichtig ist Barrel-File-Support fuer die Ranking-Qualitaet? Lohnt der Aufwand?
5. **Token-Budget Strategie:** Ist der Greedy-Ansatz gut genug, oder brauchen wir einen besseren Algorithmus?
6. **Integration:** Soll die Repo Map als MCP-Resource exponiert werden? Als API-Endpunkt?
7. **Ranking-Kalibrierung:** Wie koennen wir das Ranking objektiv messen? Ground-Truth aus Entwickler-Befragung?
8. **Aider-Kompatibilitaet:** Sollen wir das Aider Repo Map Format 1:1 uebernehmen fuer Tool-Interoperabilitaet?
