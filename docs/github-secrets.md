# GitHub Actions Secrets

Pflege unter: GitHub Repo → Settings → Secrets and variables → Actions → New repository secret

## Benötigt für CI (Tests + Supabase-Ingest)

| Secret | Beschreibung | Wo generieren |
|--------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Projekt-URL | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key (voller DB-Zugriff) | Supabase Dashboard → Settings → API |

## Benötigt für Deployment

| Secret | Beschreibung | Wo generieren |
|--------|-------------|---------------|
| `VERCEL_TOKEN` | Vercel API Token | vercel.com → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel Org/Team ID | `.vercel/project.json` nach `vercel link` |
| `VERCEL_PROJECT_ID` | Vercel Projekt ID | `.vercel/project.json` nach `vercel link` |

## Vercel IDs herausfinden

```bash
pnpm dlx vercel link   # Einmalig lokal ausführen
cat .vercel/project.json
# → { "orgId": "...", "projectId": "..." }
```

## Sicherheitshinweise

- `SUPABASE_SERVICE_ROLE_KEY` umgeht Row Level Security — nur server-side verwenden
- Secrets werden in GitHub Actions als `***` maskiert und nie in Logs sichtbar
- `.vercel/project.json` darf committed werden (enthält keine Secrets)
