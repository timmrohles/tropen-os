# Offene TODOs im Code

Stand: 2026-03-26 — extrahiert aus `grep -r "TODO\|FIXME\|HACK" src/`

## Vor erstem Kunden (kritisch)

| Datei | Zeile | TODO | Prioritaet |
|-------|-------|------|------------|
| `src/app/impressum/page.tsx` | 15, 33 | Betreiber-Daten eintragen (Name, Anschrift) | **Rechtlich Pflicht** |
| `src/app/datenschutz/page.tsx` | 16 | Betreiber-Daten + Datenschutzbeauftragter eintragen | **Rechtlich Pflicht** |

## Feature-TODOs

| Datei | Zeile | TODO | Prioritaet |
|-------|-------|------|------------|
| `src/actions/feeds.ts` | 339 | Digest-Email-Versand via Resend implementieren | Mittel |
| `src/app/api/workspaces/[id]/export/route.ts` | 61 | Plan F/G: Export in Supabase Storage + URL speichern | Niedrig |
| `src/lib/capability-resolver.ts` | 158 | Budget-Limit-Check aus org_settings verdrahten | Hoch |

## UI-TODOs

| Datei | Zeile | TODO | Prioritaet |
|-------|-------|------|------------|
| `src/components/AccountSwitcher.tsx` | 24 | Account-Switcher Backend implementieren | Niedrig |

## Zusammenfassung

- **2 rechtlich kritische TODOs** (Impressum + Datenschutz Betreiber-Daten)
- **1 Budget-TODO** das vor erstem Kunden geschlossen werden sollte
- **4 Feature-TODOs** die aufschiebbar sind
