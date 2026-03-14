import { describe, it, expect } from 'vitest'
import { buildOrgChartTheme } from './chart-theme'

describe('buildOrgChartTheme', () => {
  it('uses primary color as first color in palette', () => {
    const theme = buildOrgChartTheme({ primaryColor: '#2563EB', secondaryColor: null })
    expect(theme.color[0]).toBe('#2563EB')
  })

  it('returns transparent background', () => {
    const theme = buildOrgChartTheme({ primaryColor: '#2563EB', secondaryColor: null })
    expect(theme.backgroundColor).toBe('transparent')
  })

  it('generates a full palette of at least 5 colors', () => {
    const theme = buildOrgChartTheme({ primaryColor: '#2563EB', secondaryColor: null })
    expect(theme.color.length).toBeGreaterThanOrEqual(5)
  })

  it('falls back to default blue if no primaryColor', () => {
    const theme = buildOrgChartTheme({ primaryColor: null, secondaryColor: null })
    expect(theme.color[0]).toBe('#2563EB')
  })
})
