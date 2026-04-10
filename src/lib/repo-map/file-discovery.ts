import { readdir, readFile } from 'fs/promises'
import type { Dirent } from 'fs'
import { existsSync } from 'fs'
import path from 'path'
import ignore from 'ignore'
import type { RepoMapOptions } from './types'

const DEFAULT_IGNORES = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'coverage',
  '.turbo',
  'out',
]

const TS_EXTENSIONS = ['.ts', '.tsx']
const JS_EXTENSIONS = ['.js', '.jsx']

type DiscoverOptions = Pick<RepoMapOptions, 'rootPath' | 'ignorePatterns' | 'includePatterns' | 'languages'>

export async function discoverFiles(options: DiscoverOptions): Promise<string[]> {
  const { rootPath, ignorePatterns = [], includePatterns, languages = ['typescript', 'javascript'] } = options

  const ig = ignore()
  ig.add(DEFAULT_IGNORES)

  const gitignorePath = path.join(rootPath, '.gitignore')
  if (existsSync(gitignorePath)) {
    const gitignoreContent = await readFile(gitignorePath, 'utf-8')
    ig.add(gitignoreContent)
  }

  if (ignorePatterns.length > 0) ig.add(ignorePatterns)

  const allowedExtensions = buildAllowedExtensions(languages)
  const allFiles = await walkDir(rootPath, rootPath, ig, allowedExtensions)

  const result = includePatterns
    ? allFiles.filter((f) => includePatterns.some((p) => f.includes(p)))
    : allFiles

  return result.sort()
}

function buildAllowedExtensions(languages: ('typescript' | 'javascript')[]): Set<string> {
  const exts = new Set<string>()
  if (languages.includes('typescript')) TS_EXTENSIONS.forEach((e) => exts.add(e))
  if (languages.includes('javascript')) JS_EXTENSIONS.forEach((e) => exts.add(e))
  return exts
}

async function walkDir(
  dir: string,
  rootPath: string,
  ig: ReturnType<typeof ignore>,
  allowedExtensions: Set<string>
): Promise<string[]> {
  const results: string[] = []
  let entries: Dirent<string>[]

  try {
    entries = await readdir(dir, { withFileTypes: true, encoding: 'utf8' })
  } catch {
    return results
  }

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name)
    const relativePath = path.relative(rootPath, absolutePath)
    const normalizedRelative = relativePath.replace(/\\/g, '/')

    if (ig.ignores(normalizedRelative)) continue

    if (entry.isDirectory()) {
      const subResults = await walkDir(absolutePath, rootPath, ig, allowedExtensions)
      results.push(...subResults)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (allowedExtensions.has(ext)) {
        results.push(normalizedRelative)
      }
    }
  }

  return results
}
