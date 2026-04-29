# ADR-009: Artifact-System — iFrame-Sandbox mit Sucrase-Transformation

**Datum:** 2026-03 — dokumentiert 2026-03-26
**Status:** Entschieden

---

## Kontext

Toro generiert auf Anfrage interaktive Inhalte: React-Komponenten, HTML-Seiten,
Chart-Visualisierungen, Reveal.js-Präsentationen, Bilder, Tabellendaten.
Diese Inhalte müssen sicher im Browser gerendert werden ohne die Host-Applikation
zu gefährden. Außerdem müssen React-Artifacts (JSX + TypeScript) im Browser
kompiliert werden.

**Anforderungen:**
- Sicheres Rendering von Toro-generiertem Code (XSS-Isolation)
- React/JSX-Artifacts ohne Build-Step rendern können
- Responsive Höhe (Artifact passt sich Inhalt an)
- Export-Fähigkeit (PowerPoint für Präsentationen)
- Typen: `html`, `react`, `chart`, `presentation`, `data`, `image`, `text`, `other`

**Alternativen evaluiert:**
- **`dangerouslySetInnerHTML`**: Kein Sandbox, direkte XSS-Gefahr
- **Shadow DOM**: Kein vollständiges Sandbox, Script-Ausführung nicht isoliert
- **Server-seitiges Rendering**: Latenz, kein interaktives React möglich
- **iFrame + `sandbox` Attribut** (gewählt): Vollständige Isolation, Browser-native

---

## Entscheidung

**iFrame mit `sandbox="allow-scripts allow-same-origin"` + Sucrase-Transformation**
in `ArtifactRenderer.tsx`.

### Rendering-Pipeline

```
Toro-Antwort (JSX/HTML-String)
  → /api/artifacts/transform (Sucrase: JSX + TypeScript → ES5)
  → ArtifactRenderer: srcdoc in <iframe sandbox="allow-scripts">
  → postMessage-Protokoll für Höhen-Sync
```

**Sucrase-Konfiguration** (`/api/artifacts/transform/route.ts`):
```typescript
transform(code, { transforms: ['jsx', 'typescript'] })
```
Sucrase statt Babel: ~10x schneller, keine Konfiguration nötig, reicht für Toro-generierten Code.

**Adaptive Höhe** via `postMessage`:
- iFrame sendet `{ type: 'iframe-resize', height: document.body.scrollHeight }`
- `ArtifactRenderer.tsx` empfängt via `window.addEventListener('message', ...)`
- ResizeObserver im iFrame feuert bei Inhaltsänderungen
- Maximum: 800px (verhindert infinite scroll bei fehlerhaftem Content)

**CDN-Bibliotheken im iFrame:**
- React-Artifacts: React 18 + ReactDOM via `unpkg.com`
- Chart-Artifacts: ECharts via CDN (ADR-005)
- Präsentations-Artifacts: Reveal.js via CDN

### Export
- PowerPoint: `pptxgenjs` via `/api/artifacts/export-pptx` (nur für `presentation`-Typ)
- Andere Exports: Browser-native (Screenshot, "Als Datei speichern")

---

## Konsequenzen

**Positiv:**
- Vollständige XSS-Isolation — Toro-Code kann Host-App nicht kompromittieren
- React-Artifacts ohne Build-Step laufbar — kein Webpack/Vite im Client
- CDN-Bibliotheken werden nicht in den App-Bundle eingebaut
- Adaptive Höhe gibt natürliches Layout ohne feste Pixel-Werte

**Negativ / Risiken:**
- `allow-same-origin` im sandbox-Attribut erlaubt Cookie-Zugriff im iFrame — bewusster Trade-off für localStorage-fähige Artifacts
- Sucrase hat keinen Tree-Shaking / Bundle-Optimierung — nur für kleinen Toro-generierten Code geeignet
- CDN-Abhängigkeit im iFrame (unpkg.com) — Offline oder CDN-Ausfall → Artifact nicht ladbar
- `postMessage`-Höhen-Sync funktioniert nur für same-origin Quellen — bei Cross-Origin-Embedding würde es brechen
- Reveal.js und ECharts über CDN: keine Versionspinning → Breaking Changes möglich
