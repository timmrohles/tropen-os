# Email-Setup – Tropen OS

Tropen OS nutzt **Resend** als SMTP-Provider für Supabase Auth-E-Mails
(Einladungen, Passwort-Reset, Magic Links).

---

## Phase 1 – Testbetrieb mit Resend Test-Domain

> Aktueller Stand. Funktioniert für Entwicklung und erste Tests.
> Einschränkung: E-Mails kommen von `onboarding@resend.dev` (Resend-eigene Domain).

### Schritt 1 – Resend Account & API-Key

1. Resend-Account anlegen: https://resend.com
2. Dashboard → **API Keys** → „Create API Key"
3. Name: `tropen-os-supabase`
4. Permissions: **Sending access**
5. API-Key kopieren → in `.env.local` als `RESEND_API_KEY=re_...` eintragen

### Schritt 2 – Supabase SMTP konfigurieren

Im Supabase Dashboard → **Authentication → Settings → SMTP**:

| Feld | Wert |
|------|------|
| Enable custom SMTP | ✅ aktivieren |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | API-Key aus Resend (beginnt mit `re_...`) |
| Sender Email | `onboarding@resend.dev` |
| Sender Name | `Tropen OS` |

→ Speichern. Supabase sendet ab sofort E-Mails über Resend.

### Schritt 3 – Email Templates eintragen

Im Supabase Dashboard → **Authentication → Email Templates**:

#### Einladung (Invite user)

**Subject:**
```
🦜 Du wurdest eingeladen – Tropen OS
```

**Message:**
```
Hallo,

du wurdest eingeladen, einem Workspace auf Tropen OS beizutreten.
Klicke auf den Link um dein Konto zu aktivieren:

{{ .ConfirmationURL }}

Toro freut sich auf dich. 🦜
– Das Tropen OS Team
```

#### Passwort-Reset (Reset password)

**Subject:**
```
🦜 Passwort zurücksetzen – Tropen OS
```

**Message:**
```
Hallo,

du hast einen Passwort-Reset angefordert.

{{ .ConfirmationURL }}

Falls du das nicht warst, ignoriere diese Mail.
– Das Tropen OS Team
```

### Schritt 4 – Test-E-Mail versenden

1. Supabase Dashboard → Authentication → Users → „Invite user"
2. Test-Adresse eingeben → E-Mail sollte ankommen
3. Resend Dashboard → Logs → Zustellung prüfen

---

## Phase 2 – Eigene Domain einrichten

> Sobald eine eigene Domain verfügbar ist (z.B. `tropen.de`).
> Ziel: E-Mails kommen von `noreply@tropen.de` oder `team@tropen.de`.

### Schritt 1 – Domain in Resend verifizieren

1. Resend Dashboard → **Domains** → „Add Domain"
2. Domain eingeben: z.B. `tropen.de`
3. DNS-Records setzen (werden von Resend angezeigt):
   - **SPF** – TXT Record: `v=spf1 include:resend.com ~all`
   - **DKIM** – CNAME Record (von Resend generiert)
   - **DMARC** – TXT Record: `v=DMARC1; p=none; rua=mailto:dmarc@tropen.de`
4. Warten auf Verifizierung (meist < 30 Minuten)

### Schritt 2 – Supabase SMTP aktualisieren

Im Supabase Dashboard → Authentication → Settings → SMTP:

| Feld | Wert |
|------|------|
| Sender Email | `noreply@tropen.de` *(oder gewünschte Adresse)* |
| Sender Name | `Tropen OS` |

Host, Port, Username und Password bleiben gleich.

### Schritt 3 – Site URL & Redirect URLs anpassen

Im Supabase Dashboard → Authentication → URL Configuration:

| Feld | Wert |
|------|------|
| Site URL | `https://tropen.de` (oder Vercel-URL) |
| Redirect URLs | `https://tropen.de/auth/callback` |

In `.env.local` / Vercel Environment Variables:
```
NEXT_PUBLIC_SITE_URL=https://tropen.de
```

### Schritt 4 – Test

1. Passwort-Reset mit echter E-Mail-Adresse testen
2. E-Mail sollte von `noreply@tropen.de` kommen
3. DKIM/SPF-Status in Resend Logs prüfen (grün = korrekt signiert)

---

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| E-Mail kommt nicht an | Resend Dashboard → Logs → Status prüfen |
| „Invalid login" in Supabase SMTP | API-Key prüfen, muss mit `re_` beginnen |
| Link im Reset-Mail führt zu `/onboarding` | `NEXT_PUBLIC_SITE_URL` prüfen; muss korrekte Domain sein |
| DKIM-Fehler | DNS-TTL abwarten (bis 48h), dann Resend Domain-Status neu laden |
| Supabase sendet weiter eigene E-Mails | „Enable custom SMTP" Checkbox muss aktiv sein + gespeichert |

---

## E-Mail-Flow (Passwort-Reset)

```
User → /forgot-password → supabase.auth.resetPasswordForEmail()
  → Supabase sendet E-Mail via Resend SMTP
  → User klickt Link → /auth/callback?code=XXX&next=/reset-password
  → Session wird erstellt → Redirect zu /reset-password
  → User gibt neues Passwort ein → supabase.auth.updateUser({ password })
  → Redirect zu /workspaces
```

## E-Mail-Flow (Einladung)

```
Admin → Onboarding Schritt 2 → inviteUserByEmail()
  → Supabase sendet E-Mail via Resend SMTP
  → Eingeladener klickt Link → /auth/callback?code=XXX (kein ?next=)
  → Session wird erstellt → Redirect zu /onboarding (default)
  → Member-Onboarding (Schritt 3–5)
```
