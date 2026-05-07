# Archiv — Pre-Pivot-Architektur (April 2026)

> **Status:** SUPERSEDED
> **Archiviert:** 2026-04-27 (Tag 4.5 nach 3-Tage-Inventur)
> **Abgelöst durch:** ADR-020 / ADR-021 / ADR-022 / ADR-023 + `docs/synthese/tag4-master-synthese.md`
> **KMU-Substanz konzentriert in:** `docs/phase-2-vision.md`

---

## Warum diese Dokumente archiviert sind

Diese vier Dokumente beschreiben die Pre-Pivot-Architektur von Tropen OS — als das Produkt noch eine **KMU-orientierte KI-Plattform** sein sollte (mit Org/Department/Member-Hierarchie, Workspaces, Custom Agents, Library-System).

Mit dem Pivot zu **Production Readiness Guide für Vibe-Coder** im April 2026 (siehe `docs/product/roadmap-2026-q2.md`) sind diese Dokumente strategisch überholt.

Sie sind aber **nicht wertlos**: Die KMU-Vision ist als Phase-2-Backup erhalten. Wenn der KMU-Markt später relevant wird, ist die konzeptuelle Substanz hier auffindbar.

---

## Inhaltsverzeichnis

| Datei | Original-Datum | Inhalt | Wo lebt die Substanz heute? |
|-------|----------------|--------|----------------------------|
| `tropen-os-architektur.md` | März 2026 (v0.5) | Drei-Ebenen-Modell (Org/Dept/Member), Wissens-Hierarchie, Kontroll-Spektrum locked/suggested/open, Transformations-Engine | `docs/phase-2-vision.md` Pfeiler 1 + 2 + 5 |
| `architecture.md` | März 2026 | Phase-2-Implementierungs-Architektur, Workspace-Card-Engine, Build-Reihenfolge | `docs/phase-2-vision.md` Pfeiler 3 + 4 |
| `architecture-navigation.md` | März 2026 (v1.0) | Aufbau vs. Produktion, Hub-Auflösung zu Live+Agenten+Community, Karten-Aggregatzustände | `docs/phase-2-vision.md` Pfeiler 3 + 4 |
| `informationsarchitektur-v2.md` | März 2026 (v2.0) | 5-Entitäten-Modell (Projekt/Artefakt/Collection/Workspace/Wissen), Workspace neu definiert als geteilter Bereich | `docs/phase-2-vision.md` Spannungs-Sektion |

---

## Wann wieder hervorholen?

Diese Dokumente sind **nicht aktiv zu lesen**. Sie sind Code-Forensik-Material.

Wenn du sie brauchst:
- **Bei Phase-2-Reaktivierung** — und auch dann zuerst `docs/phase-2-vision.md` lesen
- **Wenn jemand fragt "Warum existiert Tabelle X?"** — Hintergrund liegt hier
- **Bei ADR-Diskussionen** — falls die Pre-Pivot-Argumentation relevant wird

**Niemals direkt** als Build-Anweisung verwenden. Diese Dokumente stehen unter SUPERSEDED.

---

## Bekannte Spannungen zwischen den Dokumenten

Die vier Dokumente waren schon im Pre-Pivot-Zustand nicht widerspruchsfrei. Drei zentrale Inkonsistenzen, die in `docs/phase-2-vision.md` ausführlicher beschrieben sind:

1. **Workspace-Definition:** Karten-Graph (drei Quellen) vs. geteilter Bereich (informationsarchitektur-v2)
2. **Artefakte als Karten** vs. **Artefakte als eigene Entität**
3. **Hub** als Begriff (frühe Konzepte) vs. **Live + Agenten + Community** (architecture-navigation v1.0)

Bei Phase-2-Reaktivierung: diese Spannungen müssen vor dem Build aufgelöst werden, nicht in einem Code-Sprint mitgeliefert.
