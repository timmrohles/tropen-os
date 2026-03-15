# Tropen OS — Onboarding, AI Act & E-Mail

---

## Onboarding-Schritte

| Schritt | Inhalt | Sichtbar für |
|---------|--------|-------------|
| 1 | Organisation (Name, Logo, Farbe, Guide-Name) | Admin/Owner |
| 2 | Team-Größe + Einladungen | Admin/Owner |
| 3 | Persönlicher Stil (Name, Antwortstil, Modell) | alle |
| 4 | AI Act & Verantwortungsvolle Nutzung (Pflicht-Checkbox) | alle |
| 5 | Fertig / Willkommen | alle |

Members starten bei Schritt 3 (`totalSteps = 3`).
Admins starten bei Schritt 1 (`totalSteps = 5`).

---

## Compliance & AI Act

- User müssen AI Act Acknowledgement bestätigen (Schritt 4)
- Gespeichert in `user_preferences.ai_act_acknowledged` + `ai_act_acknowledged_at`
- Pflichtfeld: Weiter-Button bleibt deaktiviert bis Checkbox gesetzt
- Verweis auf Tropen Academy: https://tropen.de/academy
- Kurs: "KI-Dschungel Survival Pass"
- Rechtliche Grundlage: EU AI Act Artikel 4 (KI-Kompetenzpflicht)

**Offener Bug:** Art. 50 KI-VO — persistente KI-Kennzeichnung im Chat fehlt noch.

---

## Supabase SMTP — Resend

Unter **Supabase Dashboard → Authentication → Settings → SMTP**:

| Feld | Wert |
|------|------|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | `[RESEND_API_KEY]` (beginnt mit `re_...`) |
| Sender Email | `onboarding@resend.dev` |
| Sender Name | `Tropen OS` |

→ Vollständige Setup-Anleitung: `docs/email-setup.md`

---

## E-Mail Templates (Supabase Dashboard → Authentication → Email Templates)

### Einladung

**Betreff:** `🦜 Du wurdest eingeladen – Tropen OS`

```
Hallo,

du wurdest eingeladen, einem Workspace auf Tropen OS beizutreten.
Klicke auf den Link um dein Konto zu aktivieren:

{{ .ConfirmationURL }}

Toro freut sich auf dich. 🦜
– Das Tropen OS Team
```

### Passwort-Reset

**Betreff:** `🦜 Passwort zurücksetzen – Tropen OS`

```
Hallo,

du hast einen Passwort-Reset angefordert.

{{ .ConfirmationURL }}

Falls du das nicht warst, ignoriere diese Mail.
– Das Tropen OS Team
```
