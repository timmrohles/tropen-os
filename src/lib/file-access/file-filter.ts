// src/lib/file-access/file-filter.ts

export interface FileFilter {
  shouldIgnoreDir(dirName: string): boolean
  shouldIgnoreFile(filePath: string): boolean
}

const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules', '.next', '.git', 'dist', 'build',
  'coverage', '.vercel', '.turbo', '__pycache__',
  '.cache', '.output', '.nuxt', '.svelte-kit',
  '.expo', 'target', 'vendor', '.venv', 'venv',
  'out', 'tmp', 'temp', '.angular',
])

const DEFAULT_IGNORE_FILES = new Set([
  '.DS_Store', 'Thumbs.db', '.env.local', '.env',
  '.env.production', '.env.development',
])

const RELEVANT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.md', '.yml', '.yaml', '.css', '.scss',
  '.html', '.svg', '.sql', '.toml',
  '.py', '.go', '.rs', '.java', '.rb', '.php',
  '.vue', '.svelte', '.astro',
])

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
  '.woff', '.woff2', '.ttf', '.eot',
  '.pdf', '.zip', '.tar', '.gz',
  '.exe', '.bin', '.dll', '.so',
  '.mp4', '.mp3', '.avi', '.mov',
])

export function isBinaryFile(filePath: string): boolean {
  const ext = `.${filePath.split('.').pop()?.toLowerCase() ?? ''}`
  return BINARY_EXTENSIONS.has(ext)
}

export function getLanguage(filePath: string): string {
  const ext = `.${filePath.split('.').pop()?.toLowerCase() ?? ''}`
  const map: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'typescript',
    '.js': 'javascript', '.jsx': 'javascript',
    '.mjs': 'javascript', '.cjs': 'javascript',
    '.py': 'python', '.go': 'go', '.rs': 'rust',
    '.java': 'java', '.rb': 'ruby', '.php': 'php',
    '.css': 'css', '.scss': 'scss',
    '.html': 'html', '.vue': 'vue', '.svelte': 'svelte',
    '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml',
    '.md': 'markdown', '.sql': 'sql',
  }
  return map[ext] ?? 'text'
}

export function createFileFilter(): FileFilter {
  return {
    shouldIgnoreDir(dirName: string): boolean {
      return DEFAULT_IGNORE_DIRS.has(dirName)
    },

    shouldIgnoreFile(filePath: string): boolean {
      const name = filePath.split('/').pop() ?? ''
      if (DEFAULT_IGNORE_FILES.has(name)) return true
      if (name.startsWith('.env')) return true

      const ext = `.${name.split('.').pop()?.toLowerCase() ?? ''}`
      if (BINARY_EXTENSIONS.has(ext)) return true
      if (!RELEVANT_EXTENSIONS.has(ext)) return true

      return false
    },
  }
}
