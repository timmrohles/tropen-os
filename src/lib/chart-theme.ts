// src/lib/chart-theme.ts
// Builds an ECharts theme config from org primary color.
// Register in component: echarts.registerTheme('org-theme', buildOrgChartTheme(orgSettings))
// Theme config is stored in cards.chart_config for per-card overrides.

export interface OrgSettings {
  primaryColor: string | null
  secondaryColor?: string | null
}

export interface EChartsTheme {
  color: string[]
  backgroundColor: string
  textStyle: { color: string }
  line: { itemStyle: { borderWidth: number } }
  bar: { itemStyle: { barBorderWidth: number; barBorderColor: string } }
  pie: { itemStyle: { borderWidth: number; borderColor: string } }
}

const DEFAULT_PRIMARY = '#2563EB'

function deriveColorPalette(primary: string): string[] {
  return [
    primary,
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#F97316',
  ]
}

export function buildOrgChartTheme(orgSettings: OrgSettings): EChartsTheme {
  const primary = orgSettings.primaryColor ?? DEFAULT_PRIMARY
  const palette = deriveColorPalette(primary)

  return {
    color: palette,
    backgroundColor: 'transparent',
    textStyle: { color: '#374151' },
    line: { itemStyle: { borderWidth: 2 } },
    bar: { itemStyle: { barBorderWidth: 0, barBorderColor: 'transparent' } },
    pie: { itemStyle: { borderWidth: 2, borderColor: '#ffffff' } },
  }
}
