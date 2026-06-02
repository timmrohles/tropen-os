# Merge-Notes

Hinweise für das Mergen von `claude/gallant-hugle` → `main`.

## Onboarding „Noch keine Organisation" (Rollen-Absicherung)

**Kontext:** Der Branch `claude/gallant-hugle` zweigte am 26.03.2026 von `main` ab.
Seitdem wurde auf `main` die i18n-Umstellung eingeführt — App-Seiten liegen jetzt unter
`src/app/[locale]/…`. Die Onboarding-Änderung dieses Branches wurde gegen den alten Pfad
`src/app/onboarding/page.tsx` gemacht; auf `main` liegt die Datei unter
`src/app/[locale]/onboarding/page.tsx`.

Alle anderen Änderungen der Rollen-Absicherung liegen auf identischen Pfaden und mergen
direkt:
- `src/app/api/onboarding/complete/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/lib/roles.ts` (neu)
- `supabase/migrations/20260602000049_role_not_null_guard.sql` (neu, eindeutige Version)

**Nur die Onboarding-Page muss portiert werden.** Dafür liegt hier ein fertiger Patch:
`onboarding-noorg-locale.patch`.

### Anwendung nach dem Merge

```bash
# Im main-Stand (Verzeichniswurzel des Repos), nach dem Merge dieses Branches:
git apply docs/merge-notes/onboarding-noorg-locale.patch

# Vorab prüfen (ohne zu schreiben):
git apply --check docs/merge-notes/onboarding-noorg-locale.patch
```

Der Patch fügt der Onboarding-Page einen `noOrg`-State hinzu: Wenn ein eingeloggter User
keiner Organisation zugeordnet ist (kein Invite-Metadata, kein `public.users`-Eintrag),
sieht er eine klare „Noch keine Organisation"-Meldung statt den Wizard zu durchlaufen und
am Ende mit einem Fehler abgebrochen zu werden (invite-only-Modell).

Verifiziert gegen `origin/main` mit `git apply --check` (konfliktfrei, Stand 02.06.2026).

---

## DB↔Git-Reconciliation: nachgezogene Mai-Migrationen (02.06.2026)

Bei der Analyse fiel auf, dass die geteilte Supabase-DB (`vlwivsjfmcejhiqluaav`) vier
Migrationen enthielt, die in **keinem** Git-Branch als Datei existierten — sie wurden direkt
auf die DB angewendet, aber nie eingecheckt. `main` endete bei `…115`, die DB bei `…119`.

Die fehlenden Dateien wurden **1:1 aus den gespeicherten Statements** rekonstruiert
(`supabase_migrations.schema_migrations.statements`), nicht aus einem Schema-Diff geraten:

| Datei | Inhalt |
|-------|--------|
| `20260505000116_scan_project_profiles.sql` | scan_project_profiles + 2 Enums + RLS (ADR-027) |
| `20260505000117_audit_findings_killer_effort.sql` | audit_findings: is_killer + effort_minutes |
| `20260506000118_critical_findings_killer_coupling.sql` | Backfill: Critical-Findings → is_killer=true |
| `20260506000119_deep_review_rate_limits.sql` | deep_review_invocations + RLS |

**Hinweis:** Diese vier gehören thematisch zum Audit-/Deep-Review-System auf `main` (Stand
…115). Sie liegen hier im Branch und erreichen `main` über den Merge dieses PRs.

Zusätzlich wurde die Versions-Kennung der Rollen-Migration in der DB-History von der
MCP-generierten `20260602115823` auf die Dateiversion `20260602000049` korrigiert, damit
Datei und History übereinstimmen. Danach: **alle DB-Migrationen über `…115` haben ein
passendes Git-File** — Git und DB sind synchron.
