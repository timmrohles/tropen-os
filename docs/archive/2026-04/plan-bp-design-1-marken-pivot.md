# Build-Prompt BP-Design-1 — Marken-Pivot (Größe C)

> **Datum:** 2026-04-27
> **Aufwand:** 15-20 PT (~2-3 Wochen Solo-Founder-Arbeit)
> **Risiko:** Hoch — substantieller visueller und sprachlicher Pivot
> **Sprint 1 Status:** Pausiert nach BP6, BP7-BP13 verschoben
> **Roll-Out:** Direkt in Code, kein Feature-Flag

---

## Pflicht-Lektüre VOR Build-Start

1. `ARCHITECT.md` — Pflicht-Protokoll
2. `CLAUDE.md` — Tech Stack, Code-Regeln, Komponenten-Patterns
3. **`docs/product/marken-brief.md` — die Marken-Position (kritischste Lektüre)**
4. `docs/synthese/tag4-master-synthese.md` — Tag-4-Kontext
5. `src/app/globals.css` — aktuelle Farb-Variablen, Typografie, Komponenten-Klassen
6. `src/components/_DESIGN_REFERENCE.tsx` — Pattern-Bibliothek
7. `docs/architect-log.md` — letzte Einträge

**Wichtig:** `marken-brief.md` ist NICHT optional. Bei jeder Design-Entscheidung in diesem Build muss zurück zum Brief gegangen werden. Der Brief enthält die Anker-Frage am Ende ("Wie würde ein älterer Senior-Engineer mit Geschmack das machen?") — diese Frage ist die Korrekturschleife für unsichere Entscheidungen.

---

## Auftrag in einem Satz

Tropen OS visuell und sprachlich auf die neue Marken-Position umstellen — Schiefer-Limette-Welt, Pattern 21 streichen, Coach-Stimme als sichtbare Stimme einführen, Landing-Page mit Hero und drei Use-Case-Sektionen neu bauen. Direkt in Code, kein Feature-Flag.

---

## Architekt-Review zuerst

Vor Build-Start: Architekt-Modus aktivieren, Review nach ARCHITECT.md-Template durchführen. Erwartete Ampel: 🟡 Gelb (substantieller Umbau, aber durch Marken-Brief gut spezifiziert). Ergebnis in `docs/architect-log.md` festhalten.

---

## Aufgabe — gegliedert in vier Phasen

Die Build-Aufgabe wird in vier sequenzielle Phasen geteilt. Jede Phase muss komplett grün sein, bevor die nächste startet. Nach jeder Phase: Commit + Self-Audit (`pnpm tsc --noEmit && pnpm lint && pnpm build`).

---

## PHASE 1 — Foundation (CSS-Variablen, Streichungen, neue Patterns)

**Ziel:** Die visuelle Grundlage stimmt. Keine UI-Texte und keine neuen Komponenten in dieser Phase — nur CSS und Pattern-Streichungen.

### Schritt 1.1 — Neue Farb-Variablen

`src/app/globals.css` umstellen:

**Streichen:**
```css
/* Diese Variablen werden komplett gestrichen oder umfunktioniert */
--accent: #2D7A50;          /* Tropen-Grün — STREICHEN */
--accent-light: #D4EDDE;    /* helles Grün — STREICHEN */
--active-bg: #1A2E23;       /* dunkles Grün — STREICHEN */
```

**Neu einführen:**
```css
:root {
  /* Bestehende Welt bleibt */
  --bg-base: #EAE9E5;
  --bg-surface: rgba(255,255,255,0.85);
  --text-primary: #1A1714;
  --text-secondary: #4A4540;
  --text-tertiary: #6B6560;
  --border: rgba(26,23,20,0.10);

  /* Neue Akzent-Welt: Schiefer + Limette */
  --accent: #3F4A55;            /* Schiefer — Primär */
  --accent-hover: #2D3640;      /* Schiefer dunkler — Hover */
  --accent-light: #E8EAEC;      /* Schiefer hellst — Subtle Highlights */

  --secondary: #A8B852;         /* Limette — Sekundär */
  --secondary-hover: #93A346;   /* Limette dunkler */
  --secondary-light: #EEF2DD;   /* Limette hellst — Trend-Highlights */

  /* Status-Farben */
  --status-success: #5C8A52;    /* Grün-erfüllt — sehr sparsam */
  --status-warning: #D9852C;    /* Amber — mittlere Severity */
  --status-danger: #C8553D;     /* Rot — Pflicht-Tags, kritische Findings */
  --status-info: #5B7A95;       /* Info-Blau */

  /* Surface-Familie für Sektion-Hierarchie */
  --surface-warm: #FAF7F2;      /* warmes Off-White */
  --surface-cool: #F2F4F1;      /* kühl-getöntes Off-White, leicht limettig */
  --surface-tint: #EBEEE5;      /* Schiefer-getönt */

  /* Gradients */
  --gradient-hero: linear-gradient(135deg, #FAF7F2 0%, #EBEEE5 100%);
  --gradient-warm: linear-gradient(180deg, #FAF7F2 0%, #EAE9E5 100%);
  --gradient-data: linear-gradient(135deg, #EEF2DD 0%, #A8B852 100%);
}
```

**Wichtig:** Die genauen Hex-Werte sind Annäherung aus dem Brief. Beim Build visuell prüfen — wenn Schiefer zu kalt wirkt, einen Tick wärmer (Richtung `#3F4A50`). Wenn Limette zu schreiend, einen Tick gedämpfter (Richtung `#9CAB4A`).

### Schritt 1.2 — Code-Suche und -Migration

Alle Vorkommen der gestrichenen Variablen finden und migrieren:

```bash
grep -rn "var(--accent)" src/ --include="*.tsx" --include="*.ts" --include="*.css"
grep -rn "var(--accent-light)" src/ --include="*.tsx" --include="*.ts" --include="*.css"
grep -rn "var(--active-bg)" src/ --include="*.tsx" --include="*.ts" --include="*.css"
grep -rn "#2D7A50" src/ --include="*.tsx" --include="*.ts" --include="*.css"
grep -rn "#1A2E23" src/ --include="*.tsx" --include="*.ts" --include="*.css"
grep -rn "#D4EDDE" src/ --include="*.tsx" --include="*.ts" --include="*.css"
grep -rn "rgba(77,184,122" src/ --include="*.tsx"
```

**Migrations-Logik:**
- `var(--accent)` (war Grün) → bleibt `var(--accent)` (jetzt Schiefer) — Variable behält Namen, ändert Wert
- `var(--accent-light)` → bleibt `var(--accent-light)` (jetzt Schiefer-hellst)
- `var(--active-bg)` → ersetzen durch `var(--surface-tint)` (für Sektion-Hintergründe) oder `var(--accent)` mit niedriger Opazität (für Active-States in Listen)
- Hex-Werte direkt im Code → ersetzen durch CSS-Variablen
- Alle Vorkommen von dunklen Sektion-Hintergründen → mit Surface-Familie ersetzen (siehe Schritt 1.5)

### Schritt 1.3 — Typografie konsolidieren

`src/app/globals.css` ergänzen:

```css
:root {
  /* Bestehende Schriften bleiben */
  --font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Menlo', monospace;
}

/* Hierarchie-Klassen */
.text-hero {
  font-family: var(--font-display);
  font-size: clamp(56px, 8vw, 96px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.05;
}

.text-h1 {
  font-family: var(--font-display);
  font-size: clamp(36px, 5vw, 48px);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.text-h2 {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.text-h3 {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
}

.text-body-lg {
  font-size: 18px;
  line-height: 1.6;
}

.text-body {
  font-size: 16px;
  line-height: 1.55;
}

.text-small {
  font-size: 14px;
  line-height: 1.5;
}

.text-caption {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

.text-mono {
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.5;
}

.text-mono-lg {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 500;
  line-height: 1.4;
}
```

**Streichen:** Alle Vorkommen von Instrument Serif. Suche:
```bash
grep -rn "Instrument Serif" src/
```

Falls Instrument Serif noch in Layout oder Komponenten geladen wird, entfernen. Display-Schrift ist Plus Jakarta Sans mit Weight 800 für Hero und H1, Weight 700 für H2.

### Schritt 1.4 — Pattern 21 streichen, neue Surface-Patterns

`src/components/_DESIGN_REFERENCE.tsx` aktualisieren:

**Streichen:**
- Pattern 21 (Dunkle Sections mit `#1A2E23`) komplett entfernen
- Pattern 20 dunkle Variante (Section-Tag mit `rgba(77,184,122,0.85)`) entfernen — nur helle Variante mit `var(--accent)` bleibt

**Neu hinzufügen:**

Pattern 24 — **Surface-Sektion**:
```tsx
{/* Sektion mit warmem Surface */}
<section className="section-surface section-surface--warm section-pad section-full-bleed">
  <div className="section-inner">
    {/* Inhalt */}
  </div>
</section>

{/* Verfügbare Surface-Klassen:
   .section-surface--base   (var(--bg-base))
   .section-surface--warm   (var(--surface-warm))
   .section-surface--cool   (var(--surface-cool))
   .section-surface--tint   (var(--surface-tint))
   .section-surface--gradient-hero
   .section-surface--gradient-data
*/}
```

Pattern 25 — **Pflicht-Tag**:
```tsx
{/* DSGVO/BFSG/EU-AI-Act Pflicht-Indikator */}
<span className="duty-tag duty-tag--dsgvo">DSGVO-Pflicht</span>
<span className="duty-tag duty-tag--bfsg">BFSG-Pflicht</span>
<span className="duty-tag duty-tag--ai-act">EU-AI-Act-Pflicht</span>
<span className="duty-tag duty-tag--security">Sicherheits-kritisch</span>
```

CSS:
```css
.duty-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 3px;
  font-family: var(--font-mono);
}

.duty-tag--dsgvo,
.duty-tag--bfsg,
.duty-tag--ai-act {
  background: rgba(200, 85, 61, 0.12);
  color: var(--status-danger);
  border: 1px solid rgba(200, 85, 61, 0.25);
}

.duty-tag--security {
  background: rgba(217, 133, 44, 0.12);
  color: var(--status-warning);
  border: 1px solid rgba(217, 133, 44, 0.25);
}
```

Pattern 26 — **Daten-Highlight (Mono-Display)**:
```tsx
{/* Große Zahl in Mono-Schrift als visueller Akzent */}
<div className="data-highlight">
  <span className="data-highlight__number">183</span>
  <span className="data-highlight__label">Regeln in 25 Kategorien</span>
</div>
```

```css
.data-highlight {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-highlight__number {
  font-family: var(--font-mono);
  font-size: clamp(48px, 6vw, 72px);
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
  letter-spacing: -0.02em;
}

.data-highlight__label {
  font-size: 13px;
  color: var(--text-tertiary);
  font-weight: 500;
}
```

### Schritt 1.5 — Sektion-Klassen einführen

`src/app/globals.css` ergänzen:

```css
/* Sektion-Surface-Familie */
.section-surface {
  position: relative;
}

.section-surface--base {
  background: var(--bg-base);
}

.section-surface--warm {
  background: var(--surface-warm);
}

.section-surface--cool {
  background: var(--surface-cool);
}

.section-surface--tint {
  background: var(--surface-tint);
}

.section-surface--gradient-hero {
  background: var(--gradient-hero);
}

.section-surface--gradient-data {
  background: var(--gradient-data);
}

/* Volle Breite (überspringt Page-Wrapper-Padding) */
.section-full-bleed {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
}

/* Sektion-Padding */
.section-pad {
  padding: clamp(64px, 10vw, 120px) 0;
}

.section-pad--hero {
  padding: clamp(96px, 14vw, 160px) 0;
}

.section-pad--compact {
  padding: clamp(48px, 8vw, 80px) 0;
}

/* Sektion-Inner (für maximalen Inhalt) */
.section-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 56px);
}

.section-inner--wide {
  max-width: 1400px;
}

.section-inner--narrow {
  max-width: 720px;
}
```

### Schritt 1.6 — Buttons umfärben

Bestehende Button-Klassen auf neue Akzent-Welt umstellen:

```css
.btn-primary {
  background: var(--accent);          /* Schiefer */
  color: #ffffff;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

/* Sekundär-Akzent für besondere Aktionen (selten verwendet) */
.btn-secondary {
  background: var(--secondary);       /* Limette */
  color: var(--text-primary);
}

.btn-ghost {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-ghost:hover {
  background: var(--accent-light);
  border-color: var(--accent);
}

.btn-danger {
  background: var(--status-danger);
  color: #ffffff;
}
```

### Phase 1 Qualitätscheck

- [ ] `pnpm tsc --noEmit` grün
- [ ] `pnpm lint` grün
- [ ] `pnpm build` grün
- [ ] Keine Hex-Werte direkt im Code (nur in `globals.css`)
- [ ] `var(--accent)` ist überall Schiefer, nirgendwo mehr Grün
- [ ] `var(--active-bg)` taucht nicht mehr auf
- [ ] Pattern 21 ist aus Design-Reference entfernt
- [ ] Patterns 24, 25, 26 sind in Design-Reference dokumentiert
- [ ] App startet, Buttons sehen schiefer-grau aus, keine Grün-Reste sichtbar

**Commit:** `feat(design): phase 1 — schiefer-limette foundation, pattern 21 raus, neue patterns 24-26`

---

## PHASE 2 — Coach-Stimme in Schlüssel-Texten

**Ziel:** Die UI-Texte sprechen die Coach-Stimme. Keine neuen Komponenten — nur Text-Änderungen in bestehenden Komponenten.

### Schritt 2.1 — Audit-Seite UI-Texte

| Element | Alt | Neu (Coach-Stimme) |
|---------|-----|-------------------|
| Page-Title | "Audit Report" | "Schauen wir uns deinen Code an" |
| Empty State | "Noch kein Audit gelaufen" | "Lass uns loslegen — ich brauche nur dein Repo" |
| Loading | "Audit läuft..." | "Geh gerade durch deinen Code, einen Moment." |
| Score-Header > 85% | "🟢 Production Grade" | "Solide. Production-Grade-Niveau." |
| Score-Header 70-84% | "🟡 Stable" | "Stable. Da kannst du stolz sein. Ein paar Hebel für mehr:" |
| Score-Header 50-69% | "🟠 Risky" | "Da ist noch Arbeit. Wir wissen ja jetzt wo." |
| Score-Header < 50% | "🔴 Prototype" | "Noch im Aufbau — das ist okay. Hier sind die wichtigsten Hebel:" |

### Schritt 2.2 — Cluster-Headlines polieren

| Pattern | Alt | Neu |
|---------|-----|-----|
| Datei-Längen-Cluster | "Mehrere Dateien zu lang" | "Du hast {N} Dateien über 500 Zeilen — Zeit für eine Trennung" |
| Hex-Werte-Cluster | "Hardcoded colors found" | "Hex-Werte direkt im Code — lass uns das auf Variablen ziehen" |
| Cognitive Complexity | "Functions too complex" | "Ein paar Funktionen sind ziemlich verschachtelt — Refactor lohnt sich" |

Generelle Stimm-Formel: **Beobachtung + Konsequenz + Vorschlag**.

### Schritt 2.3 — Compliance-Pflicht-Tags integrieren

In den Compliance-Findings (Tier 3): Pflicht-Tag (Pattern 25) vor jedem Finding-Titel anzeigen.

Beispiel:
```tsx
<div className="finding finding--compliance">
  <span className="duty-tag duty-tag--dsgvo">DSGVO-Pflicht</span>
  <h3 className="finding__title">Datenexport-Endpoint fehlt</h3>
  <p className="finding__description">
    Art. 20 DSGVO — nicht verhandelbar. So bekommst du das sauber:
  </p>
  {/* Fix-Prompt */}
</div>
```

Das Mapping welche Rule welcher Pflicht entspricht (DSGVO/BFSG/AI-Act), bleibt vorerst rudimentär — wenn nicht klar zugeordnet, generisches `[Pflicht]`-Tag verwenden. Vollständige Mapping-Tabelle ist Teil von BP9 (verschoben).

### Schritt 2.4 — Score-Trend-Texte

Wenn ein Score-Vergleich vor/nach existiert:
- "↑ +5% gegenüber letztem Audit" → "↑ +5% — du machst Fortschritt"
- "↓ -3% gegenüber letztem Audit" → "↓ -3% — schau mal was reingekommen ist"
- Erstmaliger Audit → "Erster Audit. Hier ist deine Baseline."

### Schritt 2.5 — Globale UI-Texte

| Element | Coach-Stimme-Vorschlag |
|---------|----------------------|
| "Loading..." | "Einen Moment." |
| "An error occurred" | "Da ist was schiefgegangen — magst du es nochmal versuchen?" |
| "404 — Not Found" | "Diese Seite gibt's nicht. Vielleicht das hier?" |
| Audit-Submit-Button | "Los geht's" |

**Disziplin:** Coach-Stimme nur wo das Tool **mit dem User spricht** (Findings, Empty States, Score-Kommentare, Loading), nicht wo es **etikettiert** (Buttons, Form-Labels, Settings-Begriffe).

### Phase 2 Qualitätscheck

- [ ] `pnpm tsc --noEmit` grün
- [ ] `pnpm lint` grün
- [ ] Audit-Seite öffnen — Texte sind in Coach-Stimme
- [ ] Empty States in 3+ Bereichen geprüft (Audit, Dashboard, Settings)
- [ ] Score-Kommentare zeigen alle 4 Status-Texte korrekt
- [ ] Pflicht-Tags sind in Compliance-Findings sichtbar
- [ ] Marketing-Slang nirgendwo versehentlich eingebaut

**Commit:** `feat(design): phase 2 — coach-stimme in audit-ui, pflicht-tags integriert`

---

## PHASE 3 — Landing-Page Hero + Use-Case-Sektionen

**Ziel:** Landing-Page (`/` oder `/de`) bekommt komplett neue Hero und drei Use-Case-Sektionen.

### Schritt 3.1 — Hero-Sektion neu bauen

Neue Komponente `src/components/landing/HeroSection.tsx`:

```tsx
'use client'

export function HeroSection() {
  return (
    <section className="section-surface section-surface--gradient-hero section-full-bleed section-pad--hero">
      <div className="section-inner">
        <div className="hero-grid">
          {/* Linke Spalte: Marketing */}
          <div className="hero-text">
            <h1 className="text-hero">
              Dein Code,<br />
              in Production-Reife.
            </h1>
            <p className="text-body-lg" style={{ marginTop: 24, color: 'var(--text-secondary)', maxWidth: 480 }}>
              Wir prüfen deinen Vibe-Code in 60 Sekunden. Du bekommst Findings,
              Fix-Prompts und einen klaren Score. Direkt in Cursor weiterarbeiten.
            </p>

            <div className="hero-cta" style={{ marginTop: 32, display: 'flex', gap: 12 }}>
              <button className="btn-primary">+ Audit starten</button>
              <button className="btn-ghost">Repo verbinden</button>
            </div>

            {/* Trust-Punkte */}
            <div className="hero-trust" style={{ marginTop: 48, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div className="data-highlight">
                <span className="data-highlight__number">183</span>
                <span className="data-highlight__label">Regeln</span>
              </div>
              <div className="data-highlight">
                <span className="data-highlight__number">25</span>
                <span className="data-highlight__label">Kategorien</span>
              </div>
              <div className="data-highlight">
                <span className="data-highlight__number">60s</span>
                <span className="data-highlight__label">pro Audit</span>
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Beispiel-Finding */}
          <div className="hero-example">
            <ExampleFindingCard />
          </div>
        </div>
      </div>
    </section>
  )
}
```

`ExampleFindingCard` zeigt ein realistisches Tropen-Finding — echte Daten aus dem eigenen Code, kein Mockup.

### Schritt 3.2 — Use-Case-Sektion 1: Sicherheit

`src/components/landing/UseCaseSecurity.tsx` — Surface `--base`, Coach-Eyebrow, 2-Spalten (Erklärung + Beispiel-Finding).

### Schritt 3.3 — Use-Case-Sektion 2: Performance

`src/components/landing/UseCasePerformance.tsx` — Surface `--warm`, Bundle-Analyse + Render-Performance.

### Schritt 3.4 — Use-Case-Sektion 3: Compliance

`src/components/landing/UseCaseCompliance.tsx` — Surface `--tint` (Schiefer-Hauch), DSGVO/BFSG/EU AI Act als Status-Karten.

### Schritt 3.5 — Final-CTA-Sektion

`src/components/landing/FinalCTA.tsx` — Surface `--gradient-data`, Headline "Audit jetzt.", CTA "Los geht's".

### Schritt 3.6 — Landing-Page-Komposition

`src/app/[locale]/page.tsx` neu zusammensetzen mit neuen Komponenten. Alte Komponenten vorerst mit Deprecated-Hinweis belassen (nicht löschen).

### Phase 3 Qualitätscheck

- [ ] `pnpm tsc --noEmit` grün
- [ ] `pnpm lint` grün
- [ ] `pnpm build` grün
- [ ] Landing-Page öffnen — Hero zeigt Coach-Stimme + Beispiel-Finding
- [ ] Drei Use-Case-Sektionen mit unterschiedlichen Surfaces
- [ ] Mobile (DevTools <768px): Layout bricht nicht, Hero wird einspaltig
- [ ] Scroll-Rhythmus: maximal 5 Sektion-Wechsel, keine harten Brüche
- [ ] Beispiel-Finding-Card sieht produktreif aus

**Commit:** `feat(design): phase 3 — landing-page hero + drei use-case-sektionen + final-cta`

---

## PHASE 4 — Doku, ADR, Self-Audit

**Ziel:** Marken-Pivot ist im Repo dokumentiert, ADR existiert, Self-Audit gelaufen.

### Schritt 4.1 — ADR-024 schreiben

`docs/adr/024-marken-pivot.md` — Kontext, Entscheidung (10 Pfeiler), Konsequenzen positiv/negativ, Risiken + Mitigation.

### Schritt 4.2 — Roadmap aktualisieren

`docs/product/roadmap-2026-q2.md` — Sprint 1 Verschiebung, Marken-Pivot als Zwischenphase.

### Schritt 4.3 — CLAUDE.md aktualisieren

- Farb-Variablen-Sektion: neue Welt eintragen
- Patterns: 24–26 rein
- Pflicht-Lektüre für UI-Builds: `docs/product/marken-brief.md`
- Coach-Stimme als verbindliche UI-Sprache mit Verweis auf Brief

### Schritt 4.4 — architect-log.md

BP-Design-1 (Größe C) Retro mit Phasen-Status, Score-Vergleich, Lernmuster, Sprint-1-Wiederaufnahme-Hinweis.

### Schritt 4.5 — Self-Audit

```
pnpm exec tsx src/scripts/run-audit.ts --skip-cli
```

Score notieren. Vergleich zu Pre-Pivot.

### Schritt 4.6 — Git-Tag

```bash
git tag -a brand-pivot-complete -m "Marken-Pivot abgeschlossen — Coach-Position + Schiefer-Limette-Welt"
git push origin brand-pivot-complete
```

### Phase 4 Qualitätscheck

- [ ] ADR-024 existiert
- [ ] Roadmap aktualisiert
- [ ] CLAUDE.md aktualisiert
- [ ] architect-log.md ergänzt
- [ ] Self-Audit gelaufen, Score dokumentiert
- [ ] Git-Tag gesetzt

**Commit:** `feat(design): phase 4 — adr-024, roadmap update, claude.md update`

---

## Risiken und Stolpersteine

1. **Migrations-Lücken** — grep-Suche kann Stellen übersehen. Visueller Full-App-Check nach Phase 1 Pflicht.
2. **Drittbibliotheken** — Tremor, ECharts haben eigene Farb-Konfigurationen. Separat anpassen.
3. **Coach-Stimme inkonsistent** — Im Zweifel sachlich lassen statt halb-coachend.
4. **Hero-Card mockup-haft** — Echte Tropen-Findings verwenden, kein Stock-Code.
5. **Sprint 1 vergessen** — Nach Build: BP7-BP13 explizit wiederaufnehmen.

---

## Was NICHT in diesem Build enthalten ist

- Logo / Wortmarke (Naming-Pivot später)
- Mascot-Verabschiedung Toro (beim Naming-Pivot)
- Compliance-Mapping-Tabelle (BP9)
- Audit-Tier-UI Sticky-Tabs (BP7)
- Bulk-Download (BP8)
- Cockpit→Projektboard (BP10)

---

## Anker-Frage bei Unsicherheit

> *Wie würde ein älterer Senior-Engineer mit Geschmack das machen — direkt, kompetent, mit Haltung, aber auf Augenhöhe?*
