// src/lib/audit/utils/file-utils.unit.test.ts

import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return { ...actual, existsSync: vi.fn() }
})

import { existsSync } from 'fs'
import { fileExists, fileExistsInAnyOf } from './file-utils'

const mockExists = vi.mocked(existsSync)

beforeEach(() => mockExists.mockReset())

describe('fileExists', () => {
  it('returns false when rootPath is undefined', () => {
    expect(fileExists(undefined, '.env.example')).toBe(false)
  })

  it('returns true when the file exists on disk', () => {
    mockExists.mockReturnValue(true)
    expect(fileExists('/project', '.env.example')).toBe(true)
  })

  it('returns false when the file does not exist on disk', () => {
    mockExists.mockReturnValue(false)
    expect(fileExists('/project', '.env.example')).toBe(false)
  })

  it('passes the joined absolute path to existsSync', () => {
    mockExists.mockReturnValue(false)
    fileExists('/root', 'docs/backup.md')
    expect(mockExists).toHaveBeenCalledWith(expect.stringContaining('backup.md'))
  })
})

describe('fileExistsInAnyOf', () => {
  it('returns false when rootPath is undefined', () => {
    expect(fileExistsInAnyOf(undefined, ['a', 'b'])).toBe(false)
  })

  it('returns true when the first path exists', () => {
    mockExists.mockReturnValueOnce(true)
    expect(fileExistsInAnyOf('/project', ['a.md', 'b.md'])).toBe(true)
  })

  it('returns true when only the second path exists', () => {
    mockExists.mockReturnValueOnce(false).mockReturnValueOnce(true)
    expect(fileExistsInAnyOf('/project', ['a.md', 'b.md'])).toBe(true)
  })

  it('returns false when no paths exist', () => {
    mockExists.mockReturnValue(false)
    expect(fileExistsInAnyOf('/project', ['a.md', 'b.md', 'c.md'])).toBe(false)
  })
})
