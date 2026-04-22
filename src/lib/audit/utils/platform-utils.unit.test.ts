import { describe, it, expect } from 'vitest'
import { platformCommand } from './platform-utils'

describe('platformCommand', () => {
  it('returns pnpm.cmd on win32', () => {
    expect(platformCommand('pnpm', 'win32')).toBe('pnpm.cmd')
    expect(platformCommand('npm', 'win32')).toBe('npm.cmd')
    expect(platformCommand('npx', 'win32')).toBe('npx.cmd')
    expect(platformCommand('yarn', 'win32')).toBe('yarn.cmd')
  })

  it('returns plain name on linux', () => {
    expect(platformCommand('pnpm', 'linux')).toBe('pnpm')
    expect(platformCommand('npm', 'linux')).toBe('npm')
  })

  it('returns plain name on darwin', () => {
    expect(platformCommand('pnpm', 'darwin')).toBe('pnpm')
  })

  it('defaults to process.platform', () => {
    // Smoke-test: result must be either 'pnpm' or 'pnpm.cmd'
    const result = platformCommand('pnpm')
    expect(['pnpm', 'pnpm.cmd']).toContain(result)
  })
})
