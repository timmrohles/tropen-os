# Committee Review: fix-engine

> Generiert am 2026-04-09 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Konsens-Bericht: LLM-basierte Fix-Engine Bewertung

## 1. Context-Builder

**Konsens-Level**: EINIG

Alle vier Modelle identifizieren den Context-Builder als Hauptschwachstelle. Der aktuelle Ansatz lädt Projektkontext nur bei fehlendem `filePath`, was zu generischen statt projektspezifischen Fixes führt.

**Top-Empfehlung**: Projektkontext IMMER laden und um Repository-Struktur, Abhängigkeiten und ähnliche Dateien erweitern.

**Konkreter Fix** (Konsens aus allen Modellen):
```typescript
export function buildEnhancedContext(finding: FindingRow, rootPath: string): FixContext {
  const baseContext = buildFixContext(finding, rootPath);
  
  return {
    ...baseContext,
    // IMMER laden, nicht nur bei fehlendem filePath
    projectContext: buildProjectContext(rootPath),
    
    // NEU: Repository-Struktur für Architektur-Verständnis
    repositoryStructure: analyzeRepoStructure(rootPath),
    
    // NEU: Ähnliche Dateien als Referenz
    similarFiles: findSimilarFiles(finding.file_path, finding.rule_id, rootPath)
      .slice(0, 3) // Max 3 für Token-Limit
      .map(fp => {
        const content = safeRead(path.join(rootPath, fp), 100);
        return `### ${fp}\n\`\`\`typescript\n${content}\n\`\`\``;
      })
      .join('\n')
  };
}
```

## 2. Generator Prompt

**Konsens-Level**: EINIG

Alle Modelle bemängeln die generischen Anweisungen und fehlende Anti-Halluzinations-Direktiven.

**Top-Empfehlung**: Explizite Anweisungen gegen Halluzinationen und für projektspezifische Fixes basierend auf bereitgestelltem Kontext.

**Konkreter Fix**:
```typescript
const SYSTEM_PROMPT = `You are a senior software engineer fixing audit findings.

CRITICAL RULES:
1. USE ONLY the provided context - DO NOT hallucinate dependencies or file contents
2. Match project style from similar files in context
3. If context insufficient: set diffs=[] and confidence="low" with explanation

PROJECT CONTEXT:
${ctx.repositoryStructure}

SIMILAR FILES FOR REFERENCE:
${ctx.similarFiles}

For missing files: Use actual dependencies from package.json, not generic templates.
For validation fixes: Follow patterns from similar routes in context.
`;
```

## 3. Nicht-diffbare Findings

**Konsens-Level**: EINIG

Alle Modelle erkennen die unzureichende Handhabung von Dokumentations- und Architektur-Findings.

**Top-Empfehlung**: Erweiterte Response-Struktur mit `documentationFix` oder `manualSteps` für nicht-diffbare Änderungen.

**Konkreter Fix**:
```typescript
export interface EnhancedFixResponse extends FixLlmResponse {
  documentationFix?: {
    type: 'create-file' | 'update-docs' | 'add-script'
    targetPath: string
    template: string        // Vollständiger Inhalt
    instructions: string[]  // Schritt-für-Schritt
  }
}

// Im Prompt ergänzen:
"For documentation fixes (README, runbooks):
- Set diffs=[]
- Provide complete content in documentationFix.template
- Include step-by-step instructions for manual tasks"
```

## 4. Applier Robustheit

**Konsens-Level**: MEHRHEIT

Drei Modelle (Claude, Gemini, Grok) empfehlen AST-basierte oder semantische Patch-Ansätze. GPT-4O fokussiert auf kleinere Verbesserungen des bestehenden Systems.

**Top-Empfehlung**: Beibehaltung des robusten Content-based Matching als Basis, aber Ergänzung um AST-basierte Validierung für strukturelle Änderungen.

**Konkreter Fix**:
```typescript
// Erweiterte Validierung nach Apply
async function validateAppliedFix(filePath: string, fileType: string): Promise<boolean> {
  // TypeScript bereits vorhanden via tsc
  if (fileType === '.ts' || fileType === '.tsx') return true;
  
  // NEU: ESLint für JS/JSX
  if (fileType === '.js' || fileType === '.jsx') {
    const result = await execAsync(`pnpm eslint "${filePath}" --format=compact`);
    return !result.includes('error');
  }
  
  // NEU: JSON Schema Validation
  if (fileType === '.json') {
    try {
      JSON.parse(await fs.readFile(filePath, 'utf-8'));
      return true;
    } catch { return false; }
  }
  
  return true; // Andere Dateitypen durchlassen
}
```

## 5. Architektur-Empfehlung

**Konsens-Level**: EINIG

Alle Modelle empfehlen eine stärkere Verzahnung der Komponenten und bessere Nutzung des Projektkontexts.

**Top-Empfehlung**: Context-Enhancement als zentrale Komponente, die fehlende Informationen proaktiv erkennt und ergänzt.

**Konkreter Fix**:
```typescript
class ContextEnhancementEngine {
  async enhance(finding: FindingRow, baseContext: FixContext): Promise<EnhancedContext> {
    // Regel-spezifische Kontext-Erweiterung
    const enhancers = {
      'missing-readme': this.enhanceWithPackageJson,
      'api-validation': this.enhanceWithSimilarRoutes,
      'large-component': this.enhanceWithComponentPatterns
    };
    
    const enhancer = enhancers[finding.rule_category] || this.defaultEnhancer;
    return await enhancer(finding, baseContext);
  }
}
```

## Nächste Schritte

### Quick Wins (< 1 Tag)
1. **Context-Builder Fix** - Projektkontext immer laden (2h)
2. **Anti-Halluzination im Prompt** - Explizite USE ONLY Regel (1h)
3. **Similar Files Loading** - Top 3 ähnliche Dateien als Referenz (4h)

### Strukturelle Änderungen (1-3 Tage)
1. **DocumentationFix Response-Typ** - Erweiterte Struktur für non-diffable Fixes (1 Tag)
2. **Multi-Format Validation** - ESLint/JSON-Validation nach Apply (1 Tag)
3. **Context Enhancement Engine** - Regel-spezifische Kontext-Erweiterung (2-3 Tage)

### Größte Impact-Priorität
1. **Context-Builder erweitern** → Löst 80% der generischen Fix-Probleme
2. **Anti-Halluzination Prompt** → Verhindert erfundene Dependencies
3. **DocumentationFix Struktur** → Macht non-diffable Findings nutzbar

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |   14374 |    2048 | €0.0687 |
| GPT-4o           |   11617 |     767 | €0.0341 |
| Gemini 2.5 Pro   |   13223 |    2043 | €0.0344 |
| Grok 4           |   12198 |    2550 | €0.0696 |
| Judge (Opus)     |    6222 |    1870 | €0.2172 |
| **Gesamt**       |         |         | **€0.4240** |
