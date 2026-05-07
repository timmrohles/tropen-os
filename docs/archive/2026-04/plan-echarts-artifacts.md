# ECharts — Artifact-Charts im iFrame
## Claude Code Build-Prompt

> ECharts wird via CDN im Artifact-iFrame geladen — kein pnpm install nötig.
> Toro generiert JSON-Konfiguration — kein JSX, weniger Fehler.

---

## Pflicht: Vor dem Bauen lesen

```
1. CLAUDE.md                                     → Chart-Bibliotheken Entscheidung
2. docs/webapp-manifest/engineering-standard.md  → Kategorie 22
3. src/components/workspace/ArtifactRenderer.tsx → Bestehender Renderer
4. src/app/api/chat/stream/route.ts              → System-Prompt für Artifacts
```

---

## Warum ECharts für Artifacts

```
Toro generiert React/JSX → fehleranfällig (useState, Props, JSX-Syntax)
Toro generiert ECharts JSON → simpel, deklarativ, kaum Fehler möglich

Beispiel:
{
  "xAxis": { "data": ["KW1", "KW2", "KW3", "KW4"] },
  "yAxis": {},
  "series": [{ "type": "bar", "data": [5200, 6100, 7400, 8200] }]
}
```

---

## Schritt 1 — Neuer Artifact-Typ: chart

```
<artifact type="chart" title="Wochentrend">
{
  "title": { "text": "Besucher pro Woche" },
  "xAxis": { "data": ["KW1", "KW2", "KW3", "KW4"] },
  "yAxis": { "type": "value" },
  "series": [{
    "name": "Besucher",
    "type": "bar",
    "data": [5200, 6100, 7400, 8200],
    "itemStyle": { "color": "#2D7A50" }
  }],
  "tooltip": { "trigger": "axis" }
}
</artifact>
```

---

## Schritt 2 — Chart-Renderer im iFrame

```typescript
// src/components/workspace/ArtifactRenderer.tsx erweitern

function buildChartIframe(config: object): string {
  return `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>
  <style>
    body { margin: 0; background: transparent; }
    #chart { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script>
    const chart = echarts.init(document.getElementById('chart'))
    const defaultColor = ['#2D7A50','#4A9E72','#86C9A4','#D4EDDE']
    const option = ${JSON.stringify(config)}
    if (!option.color) option.color = defaultColor
    if (!option.backgroundColor) option.backgroundColor = 'transparent'
    chart.setOption(option)
    window.addEventListener('resize', () => chart.resize())
    chart.on('click', (params) => {
      window.parent.postMessage({
        type: 'artifact-action',
        event: { type: 'click', value: params.name || params.value }
      }, '*')
    })
  </script>
</body>
</html>`
}
```

### ArtifactBlock Typ erweitern

```typescript
export interface ArtifactBlock {
  type: 'react' | 'chart'
  title: string
  code: string       // react: JSX-Code
  config?: object    // chart: geparste JSON-Config
}
// Bei type="chart": JSON.parse(content) → config
// Bei JSON-Fehler: Fallback auf Fehlermeldung im Artifact
```

### iFrame-Höhe

```typescript
// type="chart": feste Höhe 350px
// type="react": min-height 200px, auto-expand
const iframeHeight = artifact.type === 'chart' ? 350 : undefined
```

---

## Schritt 3 — System-Prompt Ergänzung

```
Wenn du Daten visualisieren möchtest (Trends, Vergleiche, Verteilungen),
verwende einen Chart-Artifact statt einer Tabelle:

<artifact type="chart" title="[Titel]">
{ ECharts-Konfiguration als valides JSON }
</artifact>

ECharts Kurzreferenz:
- Balken:  "series": [{ "type": "bar", "data": [...] }]
- Linie:   "series": [{ "type": "line", "data": [...] }]
- Torte:   "series": [{ "type": "pie", "data": [{"name":"X","value":Y}] }]
- Scatter: "series": [{ "type": "scatter", "data": [[x,y],...] }]

Immer setzen: "tooltip": { "trigger": "axis" }, "title": { "text": "..." }
Keine Farben setzen — Design wird automatisch injiziert.

Wann Chart-Artifact:
+ Zeitreihen, Vergleiche, Verteilungen, Trends
- Nicht bei < 3 Datenpunkten
- Nicht für interaktive Formulare → React-Artifact
```

---

## Abschluss-Checkliste

```bash
pnpm tsc --noEmit
pnpm lint
```

Tests:
- [ ] "zeig mir einen wochentrend für besucher kw1-kw4" → Chart-Artifact, kein React
- [ ] Balkendiagramm mit Tropen-Grün (#2D7A50)
- [ ] Hover-Tooltip funktioniert
- [ ] Tortendiagramm rendert korrekt
- [ ] Ungültige JSON-Config → Fehlermeldung statt leerem iFrame
