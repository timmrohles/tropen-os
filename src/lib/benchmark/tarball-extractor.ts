// src/lib/benchmark/tarball-extractor.ts
// Downloads a GitHub repo as tarball and extracts text files into an in-memory map.
// Uses tar-stream for streaming extraction — no temp files on disk.

import { createGunzip } from 'zlib'
import { Readable } from 'stream'
import * as tar from 'tar-stream'

export interface FileMap {
  [relativePath: string]: string
}

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.md', '.sql', '.yaml', '.yml',
  '.css', '.scss', '.html', '.env.example',
  '.gitignore', '.eslintrc', '.prettierrc',
])

const MAX_FILE_SIZE = 100 * 1024 // 100KB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB total

function isTextFile(path: string): boolean {
  if (path.endsWith('.env.example') || path.endsWith('.gitignore')) return true
  const ext = '.' + path.split('.').pop()
  return TEXT_EXTENSIONS.has(ext)
}

function stripPrefix(entryPath: string): string {
  // Tarball entries have a prefix like "owner-repo-sha/"
  const firstSlash = entryPath.indexOf('/')
  return firstSlash >= 0 ? entryPath.slice(firstSlash + 1) : entryPath
}

export async function extractRepoFromGitHub(
  owner: string,
  repo: string,
  token: string,
): Promise<FileMap> {
  const url = `https://api.github.com/repos/${owner}/${repo}/tarball`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'tropen-os-benchmark',
    },
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`GitHub tarball download failed: ${res.status} ${res.statusText}`)
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  return extractTarball(buffer)
}

export async function extractTarball(buffer: Buffer): Promise<FileMap> {
  return new Promise((resolve, reject) => {
    const files: FileMap = {}
    let totalSize = 0

    const extract = tar.extract()

    extract.on('entry', (header, stream, next) => {
      const relPath = stripPrefix(header.name)

      if (header.type !== 'file' || !relPath || !isTextFile(relPath)) {
        stream.resume()
        next()
        return
      }

      if ((header.size ?? 0) > MAX_FILE_SIZE) {
        stream.resume()
        next()
        return
      }

      const chunks: Buffer[] = []
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('end', () => {
        const content = Buffer.concat(chunks)
        totalSize += content.length

        if (totalSize <= MAX_TOTAL_SIZE) {
          files[relPath] = content.toString('utf-8')
        }
        next()
      })
      stream.on('error', next)
    })

    extract.on('finish', () => resolve(files))
    extract.on('error', reject)

    const gunzip = createGunzip()
    gunzip.on('error', reject)

    Readable.from(buffer).pipe(gunzip).pipe(extract)
  })
}
