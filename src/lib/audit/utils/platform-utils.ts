// src/lib/audit/utils/platform-utils.ts
// Cross-platform command resolution for Node CLI tools.
// On Windows, npm/pnpm/yarn/npx are installed as .cmd batch scripts.
// execFileSync/spawnSync use CreateProcessW, which does not apply PATHEXT,
// so 'pnpm' resolves to nothing — 'pnpm.cmd' is required instead.

import { existsSync } from 'node:fs'
import { join } from 'node:path'

type NodeCli = 'pnpm' | 'npm' | 'npx' | 'yarn'

/**
 * Returns the platform-appropriate command name for Node CLI tools.
 * Use this whenever calling execFileSync/spawnSync with pnpm, npm, npx, or yarn.
 * Do NOT use with tools like git, gitleaks — they are native binaries and
 * don't have this Windows .cmd wrapper issue.
 *
 * The optional `_platform` parameter exists for unit testing only.
 */
export function platformCommand(name: NodeCli, _platform: string = process.platform): string {
  return _platform === 'win32' ? `${name}.cmd` : name
}

/**
 * Resolves the full path to a Node CLI tool, preferring the local
 * node_modules/.bin installation for hermetic resolution.
 * Falls back to platformCommand(name) (relying on PATH).
 */
export function resolveNodeCli(name: NodeCli, rootPath: string): string {
  const cmd = platformCommand(name)
  const local = join(rootPath, 'node_modules', '.bin', cmd)
  if (existsSync(local)) return local

  if (process.platform === 'win32') {
    const dirs = [process.env.APPDATA, process.env.LOCALAPPDATA].filter(Boolean) as string[]
    for (const dir of dirs) {
      for (const sub of [name, 'npm']) {
        const candidate = join(dir, sub, cmd)
        if (existsSync(candidate)) return candidate
      }
    }
  }

  return cmd
}
