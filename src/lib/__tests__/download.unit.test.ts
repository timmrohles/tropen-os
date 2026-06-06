import { describe, it, expect, vi, beforeEach } from 'vitest'
import { downloadTextFile } from '../download'

describe('downloadTextFile', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // jsdom: URL.createObjectURL/revokeObjectURL existieren nicht — stubben
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('erzeugt einen Anchor mit korrektem download-Namen und klickt', () => {
    const click = vi.fn()
    const anchor = { href: '', download: '', click } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)

    downloadTextFile('.cursorrules', '# rules')

    expect(anchor.download).toBe('.cursorrules')
    expect(anchor.href).toBe('blob:fake')
    expect(click).toHaveBeenCalledOnce()
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  })
})
