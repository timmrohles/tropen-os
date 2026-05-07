# ADR-024 — Marken-Pivot: Coach-Position + Schiefer-Korb-Welt

**Status:** Accepted  
**Datum:** 2026-04-28  
**Ersetzt:** Tropen-OS-Pre-Pivot-Design (organische Tropen-Wärme, dominantes Grün #256845, dunkle Sections #1A2E23)  
**Quellen:** `docs/active/brand-brief.md`, `docs/synthese/tag4-master-synthese.md`

---

## Kontext

Im Anschluss an die Tag-4-Synthese und das Sparring vom 2026-04-27 wurde festgestellt, dass die bisherige Marken-Position (Production Readiness Guide, Tropen-Wärme, dominantes Grün) nicht zur Zielgruppe Vibe-Coder + DACH-Compliance passt:

- **Inkonsistenz:** Helle App + dunkle Marketing-Sections brachen die Markenwahrnehmung
- **Falscher Ton:** Prüfend-streng statt ermutigend-coachend
- **Falsches Visual:** Organische Tropen-Wärme statt Engineer-Identität

---

## Entscheidung

Marken-Pivot mit zehn Pfeilern (vollständige Spezifikation: `docs/active/brand-brief.md`):

1. **Position:** Coach (statt Werkzeug oder Buddy)
2. **Charakter:** Älteres Geschwister — 2-3 Jahre voraus, auf Augenhöhe
3. **Stimme:** Senior-Engineer im PR-Review — Beobachtung + Konsequenz + Vorschlag
4. **Compliance:** Coach-Stimme + Pflicht-Tag-Pattern (`[DSGVO-Pflicht]` etc.)
5. **UI-Sichtbarkeit:** Sichtbare Stimme, kein Persona/Avatar
6. **Visuelle Energie:** Lebendiger Pragmatismus (Vercel / Plausible / Linear Mix)
7. **Farb-Welt:** Schiefer `#3F4A55` (Primär) + Limette `#A8B852` (Sekundär), warm-getönt
8. **Dunkle Sections (Pattern 21):** komplett gestrichen
9. **Surface-Familie:** `--surface-warm/cool/tint` für Sektion-Differenzierung
10. **Typografie:** Plus Jakarta Sans + Inter + JetBrains Mono (Instrument Serif gestrichen)

### Technische Umsetzung (BP-Design-1, 2026-04-28)

**Phase 1 — Foundation:**
- `--accent`: `#256845` → `#3F4A55` (Schiefer) — alle Buttons, CTAs, Active-States
- `--active-bg`: `#1A2E23` → `#1E2530` (Schiefer-Dark) — Sidebar, Bubbles, Hero
- Neue Variablen: `--secondary/#A8B852`, `--status-danger/#C8553D`, `--accent-hover`, `--accent-dark`
- `--status-production` von `--accent` entkoppelt → `#5C8A52` (Grün bleibt für Audit-Status)
- CSS-Klassen: `.text-hero/h1/h2/...`, `.section-surface--*`, `.duty-tag`, `.data-highlight`

**Phase 2 — Coach-Stimme:**
- Audit-Untertitel, Onboarding, Score-Kommentare, Delta-Texte → Coach-Stimme
- 10 Cluster-Headlines: Beobachtung + Konsequenz + Vorschlag-Formel
- DSGVO/BFSG/AI-Act-Findings zeigen rote Pflicht-Tags statt Text-Badges

**Phase 3 — Landing-Page:**
- Neue Sektions-Architektur: Hero + 3 Use-Cases + FinalCTA
- Nav-Header: Schiefer-Dark statt Tropen-Grün
- ExampleFindingCard mit echten Tropen-Findings (ai-chat/index.ts 924 Zeilen)

---

## Konsequenzen

**Positiv:**
- Eigenständige Markenwelt ohne Tropen-Erbe-Ballast
- Coach-Stimme + Pflicht-Tags integrieren Compliance ohne Stimm-Bruch
- Hell-Welt durchgängig (App + Marketing) — Inkonsistenz aufgelöst
- Mono-Schrift als Identitäts-Träger passt zu Vibe-Coder-Idiom
- Engineer-Vertrautheit durch data-highlight Pattern

**Negativ:**
- Sprint 1 (BP7–BP13) verschiebt sich um ~2-3 Wochen
- Roadmap Q2 wird knapper
- Naming-Pivot offen — "Prodify" im Nav, aber kein finaler Markenname

**Risiken:**
- Vibe-Coder-Validierung (L2) übersprungen — Coach-Marke beruht auf Founder-Intuition
- Schiefer kann bei manchen Nutzern "zu neutral" wirken
- `--secondary` (Limette) noch wenig verwendet in App-UI — Durchgängigkeit ausbaufähig

**Mitigation:**
- L2 (Vibe-Coder-Outreach) wird bei nächster Gelegenheit nachgeholt
- Marken-Brief ist Dokumentations-Anker — Anpassungen via neue ADR
- Schiefer ist adjustierbar ohne großen Migration-Aufwand (eine CSS-Variable)

---

## Was explizit NICHT geändert wurde

- Hell-Theme bleibt Default
- Plus Jakarta Sans + Inter + JetBrains Mono bleiben
- App-Funktionalität unverändert
- Sprint 1-5 Roadmap unverändert (Pivot läuft parallel)
- Compliance als zentraler Moat
- Vibe-Coder-Zielgruppe

---

## Update 2026-05-04 — Türkis standardisiert, Limette durch Korb ersetzt

**Anlass:** Beim visuellen Polish der Audit-Seite (Severity-Filterbalken, Button-Konsistenz) wurde sichtbar, dass Limette als Sekundärfarbe nicht mehr zur datengetriebenen Audit-Welt passt. Limette hatte einen grasigen, warmen Charakter — die Audit-Seite wirkt substantieller mit klaren Farbzuweisungen: Türkis für Aktionen, Korb für Highlight-Balken.

**Entscheidung:** Zwei Änderungen gleichzeitig:

1. **Türkis** (`#1E7070`, `var(--teal)`) wird als Farbe für **alle primären Action-Buttons** standardisiert (Audit starten, Fix-Session starten, Kopieren, etc.)
2. **Limette** (`#A8B852`, `var(--secondary)`) wird durch **Korb** (`#fffad3`) ersetzt — als warme Highlight-Farbe für Severity-Filterbalken und Coach-Atmosphäre-Elemente

**Konkrete Werte:**

| Variable | Alt (Limette) | Neu (Korb) |
|----------|--------------|------------|
| `--secondary` | `#A8B852` | `#fffad3` |
| `--secondary-hover` | `#93A346` | `#FFEE58` |
| `--secondary-light` | `#EEF2DD` | `#FFFEF5` |

Türkis war bereits als `--teal: #1E7070` definiert — der heutige Schritt macht es zur verbindlichen Farbe für alle primären Buttons (keine Ausnahmen mehr, keine eigenen Hex-Werte).

**Begründung:** Die Trennung Türkis/Korb schafft klare semantische Zuordnung: Türkis = "Handlung auslösen", Korb = "Information kontextualisieren". Korb als sehr helles Cremgelb ist optisch ruhiger als Limette, bricht aber trotzdem mit Weiß und setzt Filter-Balken ab.

**Differenzierung:** Korb grenzt Tropen OS visuell von Sentry (lila), DataDog (lila), Vercel (schwarz-weiß) und Linear (lila) ab — keiner dieser Wettbewerber hat ein cremgelbes Highlight-System.

**Konsequenz für Codebase:**
- `globals.css`: `--secondary` / `--secondary-hover` / `--secondary-light` auf Korb-Werte gesetzt
- Alle primären Buttons nutzen jetzt `className="btn btn-primary"` + Größenstandard `fontSize: 12, padding: '4px 12px'`
- Severity-Filterbalken in `FindingsTableApp` und `GlobalQuickWinsBar` nutzen `var(--secondary)` = Korb
- `_DESIGN_REFERENCE.tsx` Sections 3, 11, 26, 27 aktualisiert
- `CLAUDE.md` Farbpalette + Icon-Größen + Pflichtcheck aktualisiert

**Was unverändert bleibt:**
- Schiefer (`#3F4A55`, `var(--accent)`) als Haupt-Textfarbe
- Coach-Position als Marken-Stimme
- Sentry-Stil-Architektur für Tabellen-Welt
- Plus Jakarta Sans + Inter + JetBrains Mono

**Risiken:**
- Externe Marketing-Materialien (Pitch-Decks, Social-Media) sind ggf. noch auf Limette — Backlog-Notiz (s.u.)
- Code-Drift: einzelne Stellen mit hardcoded `#A8B852` könnten übersehen worden sein → Phase-2-Verifikation durchgeführt (s.u.)

**Status:** ADR bleibt **Accepted** — dieser Block ist eine Erweiterung, kein neuer Beschluss.

### Verifikation (Phase 2)

Hardcoded Limette-Werte in `src/`:
- `#A8B852`: 2 Treffer in `_DESIGN_REFERENCE.tsx` (historische Farbdoku) + 1 in `ArtifactRenderer.tsx` (unrelated) — kein App-UI betroffen
- `#a3b554` (alte Limette-Variante): 0 Treffer
- CSS-Variable `--secondary`: korrekt auf `#fffad3` gesetzt ✅
- "Limette" in aktiver Doku: nur noch in ADR-024 (historisch) + Sidebar-Kommentar in `globals.css` (folgt)

### Backlog-Notiz

Vor Beta-Onboarding zu klären: externe Marketing-Materialien auf Korb/Türkis-Migration prüfen (Pitch-Decks, Social-Media-Profile, Domain-Recherche).
