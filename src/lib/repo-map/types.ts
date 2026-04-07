/** Ein einzelnes Symbol (Funktion, Klasse, Interface, etc.) */
export interface RepoSymbol {
  /** Eindeutiger Identifier: "src/lib/logger.ts::createLogger" */
  id: string
  /** Name des Symbols */
  name: string
  /** Art des Symbols */
  kind: 'class' | 'function' | 'interface' | 'type' | 'enum' | 'const' | 'variable' | 'method' | 'property'
  /** Datei in der das Symbol definiert ist (relativ zum Repo-Root) */
  filePath: string
  /** Zeile der Definition (1-basiert) */
  line: number
  /** Ende der Definition */
  lineEnd: number
  /** Call Signature oder Type Signature (komprimiert) */
  signature: string
  /** Ist exportiert? */
  exported: boolean
  /** Parent-Symbol (z.B. Klasse für Methode) */
  parentId?: string
  /** Referenz-Count: wie oft wird dieses Symbol anderswo referenziert */
  referenceCount: number
  /** Rank-Score (0-1, nach Graph-Ranking) */
  rankScore: number
}

/** Abhängigkeit zwischen zwei Dateien */
export interface FileDependency {
  /** Importierende Datei */
  source: string
  /** Importierte Datei */
  target: string
  /** Importierte Symbole */
  symbols: string[]
}

/** Eine Datei im Repo */
export interface RepoFile {
  /** Relativer Pfad */
  path: string
  /** Sprache */
  language: 'typescript' | 'javascript' | 'json'
  /** Zeilenanzahl */
  lineCount: number
  /** Definierte Symbole */
  symbols: RepoSymbol[]
  /** Imports */
  imports: FileDependency[]
  /** Exports */
  exports: string[]
}

/** Die komprimierte Repo Map */
export interface RepoMap {
  /** Zeitpunkt der Generierung */
  generatedAt: string
  /** Repo-Root-Verzeichnis */
  rootPath: string
  /** Generator-Version */
  version: string
  /** Statistiken */
  stats: {
    totalFiles: number
    totalSymbols: number
    totalLines: number
    includedSymbols: number
    tokenBudget: number
    estimatedTokens: number
  }
  /** Alle gescannten Dateien */
  files: RepoFile[]
  /** Nur die wichtigsten Symbole (nach Ranking + Token-Budget) */
  rankedSymbols: RepoSymbol[]
  /** Datei-Abhängigkeits-Graph */
  dependencies: FileDependency[]
  /** Komprimiertes Text-Format (für LLM-Context) */
  compressedMap: string
}

/** Konfiguration für den Generator */
export interface RepoMapOptions {
  /** Repo-Root-Verzeichnis */
  rootPath: string
  /** Token-Budget für die komprimierte Map (Default: 2048) */
  tokenBudget?: number
  /** Dateien/Ordner die ignoriert werden sollen (zusätzlich zu .gitignore) */
  ignorePatterns?: string[]
  /** Nur diese Dateien/Ordner einschließen */
  includePatterns?: string[]
  /** Sprachen die geparst werden sollen */
  languages?: ('typescript' | 'javascript')[]
}
