// src/lib/file-access/directory-reader.ts
// Browser-only: File System Access API

import type { ProjectFile, DirectoryReadResult } from './types'
import { createFileFilter, isBinaryFile, getLanguage } from './file-filter'

const MAX_FILE_SIZE = 500_000 // 500 KB pro Datei

interface PathEntry {
  path: string
  fileHandle: FileSystemFileHandle
}

async function collectPaths(
  handle: FileSystemDirectoryHandle,
  basePath: string,
  filter: ReturnType<typeof createFileFilter>,
): Promise<PathEntry[]> {
  const results: PathEntry[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for await (const [name, entry] of (handle as any).entries()) {
    const path = basePath ? `${basePath}/${name}` : name

    if (entry.kind === 'directory') {
      if (filter.shouldIgnoreDir(name)) continue
      const subResults = await collectPaths(
        entry as FileSystemDirectoryHandle,
        path,
        filter,
      )
      results.push(...subResults)
    } else {
      if (filter.shouldIgnoreFile(path)) continue
      results.push({ path, fileHandle: entry as FileSystemFileHandle })
    }
  }

  return results
}

export async function readDirectory(
  handle: FileSystemDirectoryHandle,
  onProgress?: (current: number, total: number) => void,
): Promise<DirectoryReadResult> {
  const startTime = Date.now()
  const filter = createFileFilter()
  const files: ProjectFile[] = []
  const skipped: { path: string; reason: string }[] = []

  // 1. Alle Pfade sammeln
  const allPaths = await collectPaths(handle, '', filter)

  // 2. Dateien lesen
  for (let i = 0; i < allPaths.length; i++) {
    const { path, fileHandle } = allPaths[i]
    onProgress?.(i + 1, allPaths.length)

    try {
      const file = await fileHandle.getFile()

      if (file.size > MAX_FILE_SIZE) {
        skipped.push({ path, reason: `Zu groß: ${(file.size / 1024).toFixed(0)} KB` })
        continue
      }

      if (isBinaryFile(path)) {
        skipped.push({ path, reason: 'Binärdatei' })
        continue
      }

      const content = await file.text()
      files.push({ path, content, size: file.size, language: getLanguage(path) })
    } catch (err) {
      skipped.push({ path, reason: `Lesefehler: ${String(err)}` })
    }
  }

  return {
    projectName: handle.name,
    files,
    skipped,
    stats: {
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      skippedFiles: skipped.length,
      readTimeMs: Date.now() - startTime,
    },
  }
}
