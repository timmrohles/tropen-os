---
status: archived
created: 2026-05-07
sprint: Quellen-Lücken-Klärungs-Sprint
---

# Hand-Over — Quellen-Lücken-Klärungs-Sprint 2026-05-07

> Alle 7 offenen Lücken aus `docs/active/zielbild.md` Teil H (Version 3) geklärt.
> Ergebnis eingearbeitet in Teil H des Zielbild v3 und in `docs/active/architect-log.md`.

| Lücke | Status | Befund |
|-------|--------|--------|
| 1 — Regelzahl-Diskrepanz | ✅ GESCHLOSSEN | 255 Regeln verifiziert in `src/lib/audit/rule-registry.ts` (Python-Zählung, keine Duplikate). CLAUDE.md von 242 auf 255 (Stand 2026-05-07) aktualisiert. |
| 2 — Skills 4–6 | ✅ GESCHLOSSEN | Verifiziert in `supabase/migrations/20260318000047_skills.sql`. Skill 4: `knowledge_extract` / Wissensextraktion (system, json). Skill 5: `report_write` / Berichterstellung (system, artifact). Skill 6: `social_media_adapt` / Social-Media-Adaption (package/marketing). |
| 3 — ADR-Nummern-Lücken 028–030 | ✅ GESCHLOSSEN | `docs/decisions/` enthält ADR-001 bis ADR-027, keine Lücken. ADR-028 ist die nächste freie Nummer. Nummern 028–030 wurden nie angelegt — keine verworfenen ADRs. |
| 4 — `connections`-Tabelle | ✅ GESCHLOSSEN | Definiert in `supabase/migrations/031_workspaces_schema.sql`. Aktiv genutzt in `src/actions/connections.ts`, `src/lib/workspace-context.ts`, `src/lib/stale-propagation.ts`, `/api/workspaces/[id]/connections/`. |
| 5 — `workspace_assets/exports/messages/participants` | ✅ GESCHLOSSEN | Alle vier Tabellen existieren und sind produktiv genutzt. `workspace_assets` + `workspace_exports` + `workspace_messages` in `20260314000035_workspace_plan_c.sql`. `workspace_participants` in `031_workspaces_schema.sql`. Alle haben aktive Query-Aufrufe in `src/`. |
| 6 — `docs/inventory/` vs. `docs/inventur/` | ✅ GESCHLOSSEN | Beide Verzeichnisse existieren und sind vollständig leer (kein Inhalt). Keine Verschiebung nötig. |
| 7 — ADR-021 Prompt-Veredler vs. v3 | ✅ GESCHLOSSEN | `docs/decisions/021-prompt-veredler-architecture.md`: Status auf `superseded` gesetzt, `superseded_by: docs/active/zielbild.md` ergänzt. Status-Notiz oben im Body eingefügt. ADR-Inhalt historisch erhalten. |

## Geänderte Dateien

- `CLAUDE.md` — Regelzahl 242 → 255 (Stand 2026-05-07)
- `docs/decisions/021-prompt-veredler-architecture.md` — Status: proposed → superseded, Notiz oben
- `docs/active/zielbild.md` — Teil H komplett ersetzt mit geklärten Befunden
- `docs/active/architect-log.md` — Eintrag 2026-05-07 Quellen-Lücken-Klärungs-Sprint angehängt
- `docs/archive/2026-05/quellen-luecken-handover-2026-05-07.md` — dieses Dokument (neu)
