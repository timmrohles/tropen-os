# ADR-008: Chart-Bibliotheken

> **Status:** Entschieden — März 2026
> **Entscheider:** Timm

---

## Kontext

Zwei verschiedene Anwendungsfälle für Charts im Projekt:

1. **App-UI Charts** — feste Bestandteile des Interface (Dashboard, SessionPanel, Analytics)
2. **Artifact-Charts** — Toro generiert on-demand Charts im Chat als Artifact

Die Anforderungen sind grundlegend verschieden:
- App-UI: sauberes Design ohne Aufwand, Next.js/Tailwind-Integration
- Artifacts: JSON-basierte Konfiguration die Toro generieren kann, maximale Chart-Vielfalt

---

## Entscheidung

### App-UI Charts → Tremor (`@tremor/react`)

- Fertige Dashboard-Komponenten, kein Design-Aufwand
- Tailwind + Radix UI + Next.js nativ
- Baut intern auf Recharts auf — Rendering-Engine bleibt gleich
- Einsatz: KPI-Kacheln, Linien-Charts, Bar-Charts, Tracker

### Artifact-Charts → ECharts (`echarts` + `echarts-for-react`)

- Toro generiert JSON-Konfiguration — kein JSX, deutlich weniger Fehler-Potenzial
- 50+ Chart-Typen out-of-the-box
- Exzellente Optik ohne zusätzliches Styling
- Einsatz: interaktive Charts in iframe-Artifacts

---

## Entscheidungs-Regel

```
Chart ist fester Teil der App-UI?  → Tremor
Chart wird von Toro on-demand generiert?  → ECharts
Recharts direkt?  → nicht mehr neu verwenden
```

---

## Alternativen verworfen

- **Recharts direkt**: zu viel manuelles Styling, kein Vorteil gegenüber Tremor
- **ECharts für App-UI**: zu komplex für einfache KPI-Darstellungen
- **Chart.js**: schlechtere Next.js-Integration, weniger Chart-Typen als ECharts
- **D3**: zu low-level, Aufwand nicht verhältnismäßig

---

## Konsequenzen

- Zwei separate Packages im Bundle — akzeptabel wegen klar getrennter Anwendungsfälle
- Tremor wird bei Bedarf installiert (noch nicht im Projekt)
- ECharts wird bei Bedarf installiert (noch nicht im Projekt)
- Bestehende Recharts-Nutzung bleibt bis zur natürlichen Ablösung stehen
