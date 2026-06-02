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
