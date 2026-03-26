# Tremor Migration — App-UI Charts
## Claude Code Build-Prompt

> Ersetzt bestehende Recharts-Implementierungen in der App-UI
> durch Tremor-Komponenten.

---

## Pflicht: Vor dem Bauen lesen

```
1. CLAUDE.md                          → Tech Stack, Design-System
2. docs/webapp-manifest/engineering-standard.md → Kategorie 7, 15
3. src/components/workspace/SessionPanel.tsx     → Bestehende Charts
4. src/app/dashboard/                            → Dashboard-Seiten
5. src/app/globals.css                           → CSS-Variablen
```

Danach: Ampel bestimmen.

---

## Schritt 1 — Installation

```bash
# v3 (stabil, React 19 Peer-Warning aber funktionsfähig):
pnpm add @tremor/react

# v4 (beta, React 19 nativ):
pnpm add @tremor/react@beta-tremor-v4
```

Prüfen ob `tailwind.config.js` Tremor-Content enthält:
```javascript
content: [
  "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
]
```

---

## Schritt 2 — Bestehende Charts finden

```bash
grep -r "from 'recharts'\|from \"recharts\"" src/ --include="*.tsx" --include="*.ts"
grep -r "AreaChart\|LineChart\|BarChart\|PieChart" src/ --include="*.tsx"
```

---

## Schritt 3 — Tremor Theme auf Tropen OS anpassen

Unsere Akzentfarbe ist `var(--accent)` = `#2D7A50` (Grün).

In `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      tremor: {
        brand: {
          faint:    '#f0f9f4',
          muted:    '#d4edde',
          subtle:   '#86c9a4',
          DEFAULT:  '#2D7A50',
          emphasis: '#1a5c37',
          inverted: '#ffffff',
        }
      }
    }
  }
}
```

---

## Schritt 4 — Komponenten einsetzen

### SessionPanel — Kosten-Visualisierung

```tsx
import { AreaChart } from '@tremor/react'

<AreaChart
  data={costHistory}
  index="date"
  categories={['kosten']}
  colors={['emerald']}
  valueFormatter={(v) => `€${v.toFixed(4)}`}
  showLegend={false}
  showGridLines={false}
  className="h-24 mt-2"
/>
```

### Dashboard — KPI-Übersicht

```tsx
import { AreaChart, DonutChart, Card, Metric, Text, BadgeDelta } from '@tremor/react'

// KPI-Kachel
<Card>
  <Text>Kosten Session</Text>
  <Metric>€{sessionCost.toFixed(4)}</Metric>
  <BadgeDelta deltaType="increase">+12%</BadgeDelta>
</Card>

// Modell-Verteilung
<DonutChart
  data={modelUsage}
  category="tokens"
  index="model"
  colors={['emerald', 'blue', 'amber', 'violet']}
  valueFormatter={(v) => `${v.toLocaleString()} Tokens`}
/>
```

### Agent Health Monitor

```tsx
import { BarList } from '@tremor/react'

<BarList
  data={agents.map(a => ({
    name: a.name,
    value: a.health_score,
    color: a.health_score > 70 ? 'emerald' : a.health_score > 40 ? 'amber' : 'rose'
  }))}
  valueFormatter={(v) => `${v}%`}
/>
```

---

## Architektur-Constraints

- Tremor nur für App-UI — nie in Artifact-Code
- Keine Recharts-Direktimports in neuen Komponenten
- Bestehende Recharts-Nutzung bleibt bis zur natürlichen Ablösung

---

## Abschluss-Checkliste

```bash
pnpm tsc --noEmit
pnpm lint
```

- [ ] SessionPanel zeigt Tremor AreaChart
- [ ] Dashboard zeigt Tremor KPI-Cards
- [ ] Tremor-Grün entspricht var(--accent) #2D7A50
- [ ] Keine direkten Recharts-Imports in neuen Dateien
- [ ] CLAUDE.md aktualisiert
