// src/lib/file-access/types.ts

export interface ProjectFile {
  /** Relativer Pfad (z.B. "src/app/page.tsx") */
  path: string
  /** Dateiinhalt als String */
  content: string
  /** Dateigröße in Bytes */
  size: number
  /** Sprache (abgeleitet aus Dateiendung) */
  language: string
}

export interface DirectoryReadResult {
  /** Projekt-Name (Ordner-Name) */
  projectName: string
  /** Alle gelesenen Dateien */
  files: ProjectFile[]
  /** Übersprungene Dateien (zu groß, binär, ignoriert) */
  skipped: { path: string; reason: string }[]
  /** Statistiken */
  stats: {
    totalFiles: number
    totalSize: number
    skippedFiles: number
    readTimeMs: number
  }
}

export interface ScanRequest {
  projectName: string
  files: ProjectFile[]
}
