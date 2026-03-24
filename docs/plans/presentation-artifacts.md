# Präsentations-System — Konzept + Build-Prompt
## Toro generiert Slides direkt im Chat

> **Status:** Konzept + Build-Prompt März 2026
> **Artifact-Typ:** `type="presentation"` (dritter Typ neben react + chart)
> **Export:** .pptx via pptxgenjs (erst SKILL.md lesen)

---

## Konzept

Vollständig navigierbare Präsentation direkt im Chat-Artifact.
Verfeinern per Gespräch. Exportieren wenn fertig.

Drei Anwendungsfälle:
1. **Ad-hoc im Chat** — "Erstelle eine Präsentation über X"
2. **Aus Workspace** — Toro kennt alle Karten + Projekt-Gedächtnis
3. **Aus Vorlage** — Skills: Investoren-Pitch, Status-Update, Workshop

---

## Pflicht: Vor dem Bauen lesen

```
1. CLAUDE.md                                     → Design-System, Konventionen
2. docs/webapp-manifest/engineering-standard.md  → Kategorie 22
3. src/components/workspace/ArtifactRenderer.tsx → Bestehender Renderer
4. src/app/api/chat/stream/route.ts              → System-Prompt
```

Danach: Ampel bestimmen.

---

## Technologie: Reveal.js via CDN

Reines HTML/CSS/JS — Toro generiert zuverlässig, kein JSX-Fehlerrisiko.
CDN: `https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/`

---

## Artifact-Format

```
<artifact type="presentation" title="Q2 Marketing Plan" slides="8">
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.css">
  <link rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/theme/white.min.css">
  <style>
    :root {
      --r-heading-color: #1A1714;
      --r-link-color: #2D7A50;
      --r-background-color: #EAE9E5;
    }
    .reveal h2 { color: #1A1714; font-size: 1.8em; }
    .reveal li { color: #4A4540; }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <section><h1>Titel</h1><p>Untertitel</p></section>
      <section><h2>Slide 2</h2><ul><li>Punkt 1</li></ul></section>
    </div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.js"></script>
  <script>
    Reveal.initialize({ hash: true, controls: true })
    Reveal.on('slidechanged', (e) => {
      window.parent.postMessage({
        type: 'slide-changed',
        indexh: e.indexh,
        total: Reveal.getTotalSlides()
      }, '*')
    })
  </script>
</body>
</html>
</artifact>
```

---

## Schritt 1 — parse-artifacts.ts erweitern

```typescript
export interface ArtifactBlock {
  type: 'react' | 'chart' | 'presentation'
  title: string
  slideCount?: number    // aus slides="N" Attribut
  code: string
  config?: object
}
// sandbox: "allow-scripts allow-same-origin" (nötig für Reveal.js)
// iFrame-Höhe: 480px (16:9)
```

---

## Schritt 2 — ArtifactRenderer.tsx erweitern

```typescript
// Slide-Zähler unter iFrame: "◀  Slide 1 / 8  ▶"
const [currentSlide, setCurrentSlide] = useState(1)
const [totalSlides, setTotalSlides] = useState(artifact.slideCount ?? 1)

// postMessage Handler:
if (e.data.type === 'slide-changed') {
  setCurrentSlide(e.data.indexh + 1)
  setTotalSlides(e.data.total)
}
```

---

## Schritt 3 — System-Prompt Ergänzung

```
Wenn der User eine Präsentation, Slides oder Pitch möchte:
<artifact type="presentation" title="[Titel]" slides="[N]">
[Vollständiges HTML mit Reveal.js]
</artifact>

Regeln:
- Max. 8 Slides (außer explizit mehr gewünscht)
- Slide 1: Titel + Untertitel
- Slide 2-7: max. 5 Bullet-Points
- Letzte Slide: CTA oder Zusammenfassung
- Tropen OS CSS-Variablen: --r-heading-color: #1A1714, --r-background-color: #EAE9E5
- Keine Farben erfinden — nur Design-Tokens
```

---

## Schritt 4 — Quick-Chips nach Presentation-Artifact

```typescript
[
  { label: "Design ändern",    prompt: "Ändere das Design auf einen dunkleren Stil" },
  { label: "Slide hinzufügen", prompt: "Füge eine Slide über X hinzu" },
  { label: "Kürzen",           prompt: "Kürze auf 5 Slides — nur das Wesentliche" },
  { label: "Als PowerPoint",   prompt: "__EXPORT_PPTX__" }
]
```

---

## Schritt 5 — PowerPoint Export

`POST /api/artifacts/export-pptx` — parst Slide-Inhalte aus HTML (h1, h2, ul/li),
erstellt .pptx via pptxgenjs, gibt Download zurück.

```bash
pnpm add pptxgenjs
```

---

## Schritt 6 — 3 Presentation-Skills in Library seeden

- `pitch-deck` — Investoren-Pitch (8 Slides, klassische Struktur)
- `status-update` — Projekt-Status für Stakeholder (5 Slides)
- `workshop` — Workshop-Moderation (6 Slides mit Leerphasen)

SQL-Seed: vollständige Inserts in ursprünglichem Build-Prompt.

---

## Schritt 7 — Workspace-Integration

Kontext-Funktion `buildPresentationContext(workspaceId)`:
lädt alle Karten + Projekt-Gedächtnis → strukturierter Kontext für Toro.

---

## Architektur-Constraints

- Reveal.js via CDN — kein pnpm install in der App
- `sandbox="allow-scripts allow-same-origin"` — nötig für Reveal.js
- Max. 8 Slides als Default — Toro-Instruktion
- Tropen OS CSS-Variablen in jedem Template
- DB-Zugriff: supabaseAdmin — kein Drizzle

---

## Abschluss-Checkliste

```bash
pnpm tsc --noEmit
pnpm lint
```

- [ ] "erstelle eine präsentation über X" → Presentation-Artifact
- [ ] Slides navigierbar, Slide-Zähler aktuell
- [ ] Tropen OS Design (Beige, grüne Links)
- [ ] Quick-Chips erscheinen nach Artifact
- [ ] .pptx Export funktioniert
- [ ] Workspace-Karten fließen in Slides ein
- [ ] 3 Library-Skills vorhanden (pitch, status, workshop)
- [ ] CLAUDE.md aktualisiert
