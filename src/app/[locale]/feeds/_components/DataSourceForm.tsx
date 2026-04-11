'use client'
// src/app/feeds/_components/DataSourceForm.tsx — create/edit modal

import { X, Lock } from '@phosphor-icons/react'
import {
  FormSection, FormField, FormState, INTERVAL_OPTIONS, AUTH_OPTIONS,
} from './DataSourceHelpers'

interface Props {
  open: boolean
  editingId: string | null
  form: FormState
  saving: boolean
  error: string
  onChange: (patch: Partial<FormState>) => void
  onSave: () => void
  onClose: () => void
}

export function DataSourceForm({ open, editingId, form, saving, error, onChange, onSave, onClose }: Props) {
  if (!open) return null

  const f = onChange

  return (
    <div
      className="modal-overlay" style={{ zIndex: 100, padding: 16 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={editingId ? 'Datenquelle bearbeiten' : 'Neue Datenquelle anlegen'}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 560, padding: 24, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface-solid)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {editingId ? 'Datenquelle bearbeiten' : 'Neue Datenquelle'}
          </span>
          <button className="btn-icon" aria-label="Schließen" onClick={onClose}>
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 8, fontSize: 13, color: 'var(--error)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* ── Abschnitt: Grunddaten ─────────────────────────────── */}
          <FormSection label="Grunddaten">
            <FormField label="Name" hint="Ein eindeutiger Name, damit du die Quelle später wiedererkennst.">
              <input className="tdrawer-input" value={form.name} onChange={(e) => f({ name: e.target.value })}
                placeholder='z.B. "Wettbewerber-Preise" oder "Google Analytics Export"' maxLength={255} autoFocus />
            </FormField>
            <FormField label="Beschreibung" optional hint="Wozu dienen diese Daten? Wer soll sie nutzen? Hilft dir bei der Organisation.">
              <input className="tdrawer-input" value={form.description} onChange={(e) => f({ description: e.target.value })}
                placeholder='z.B. "Tägliche Preis-Updates unserer 5 Hauptkonkurrenten"' />
            </FormField>
          </FormSection>

          {/* ── Abschnitt: Verbindung ─────────────────────────────── */}
          <FormSection label="Verbindung">
            <FormField
              label="API-Adresse (URL)"
              hint={
                <>
                  Die vollständige Web-Adresse des Datenzugangs. Diese steht in der Dokumentation des Dienstes.
                  {' '}<strong>Tipp:</strong> Suche nach &bdquo;API Endpoint&ldquo;, &bdquo;Data Export URL&ldquo; oder &bdquo;Integration URL&ldquo;
                  in den Einstellungen deines Tools.
                </>
              }
            >
              <input className="tdrawer-input" value={form.url} onChange={(e) => f({ url: e.target.value })}
                placeholder="https://api.meinservice.com/v1/export" />
            </FormField>

            <FormField
              label="Abfragemethode"
              hint={
                form.method === 'GET'
                  ? 'GET = Daten nur lesen. Richtig für die meisten Datenquellen – wähle GET wenn du unsicher bist.'
                  : 'POST = Anfrage mit zusätzlichen Parametern senden. Nur nötig wenn die API-Dokumentation POST verlangt.'
              }
            >
              <div style={{ display: 'flex', gap: 8 }}>
                {(['GET', 'POST'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => f({ method: m })}
                    style={{
                      padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                      borderColor: form.method === m ? 'var(--accent)' : 'var(--border)',
                      background: form.method === m ? 'var(--accent-light)' : 'var(--bg-surface)',
                      color: form.method === m ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </FormField>
          </FormSection>

          {/* ── Abschnitt: Authentifizierung ──────────────────────── */}
          <FormSection label="Authentifizierung">
            <FormField
              label="Zugangsmethode"
              hint={
                form.authType === 'none'    ? 'Diese API ist öffentlich – keine Anmeldedaten nötig.' :
                form.authType === 'bearer'  ? 'Ein Zugriffstoken das du in den API-Einstellungen des Dienstes generierst. Meist unter „API-Tokens", „Access Tokens" oder „Developer Settings" zu finden.' :
                form.authType === 'api_key' ? 'Ein einfacher Schlüssel der mit jeder Anfrage mitgeschickt wird. Steht meist in den API-Einstellungen unter „API Key", „API Credentials" oder „Zugangsdaten".' :
                /* basic */                   'Benutzername und Passwort für den API-Zugang. Wird von älteren APIs verwendet. Nutze wenn möglich stattdessen einen API-Key.'
              }
            >
              <select className="tdrawer-select" value={form.authType} onChange={(e) => f({ authType: e.target.value })}>
                {AUTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>

            {form.authType === 'bearer' && (
              <FormField
                label="Bearer Token"
                hint='Der lange Zugriffsschlüssel aus den API-Einstellungen. Sieht oft so aus: "eyJhbG…" oder eine zufällige Zeichenkette wie "sk-abc123…"'
              >
                <input className="tdrawer-input" type="password" value={form.bearerToken}
                  onChange={(e) => f({ bearerToken: e.target.value })}
                  placeholder="Hier den Token einfügen…" autoComplete="off" />
              </FormField>
            )}

            {form.authType === 'api_key' && (
              <>
                <FormField
                  label="Header-Name"
                  hint='Der technische Name des Feldes. Steht in der API-Dokumentation. Häufige Werte: "X-API-Key", "X-Auth-Token", "API-Key". Im Zweifel: "X-API-Key" lassen.'
                >
                  <input className="tdrawer-input" value={form.apiKeyHeader}
                    onChange={(e) => f({ apiKeyHeader: e.target.value })} placeholder="X-API-Key" />
                </FormField>
                <FormField
                  label="API-Key"
                  hint="Dein persönlicher Zugriffsschlüssel. Diesen findest du in den API-Einstellungen des Dienstes."
                >
                  <input className="tdrawer-input" type="password" value={form.apiKeyValue}
                    onChange={(e) => f({ apiKeyValue: e.target.value })}
                    placeholder="Hier den Key einfügen…" autoComplete="off" />
                </FormField>
              </>
            )}

            {form.authType === 'basic' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FormField label="Benutzername" hint="Der API-Benutzername (oft die E-Mail-Adresse).">
                  <input className="tdrawer-input" value={form.basicUser}
                    onChange={(e) => f({ basicUser: e.target.value })} autoComplete="off" />
                </FormField>
                <FormField label="Passwort" hint="Das API-Passwort (nicht das Login-Passwort deines Accounts).">
                  <input className="tdrawer-input" type="password" value={form.basicPassword}
                    onChange={(e) => f({ basicPassword: e.target.value })} autoComplete="off" />
                </FormField>
              </div>
            )}

            {form.authType !== 'none' && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'rgba(45, 122, 80, 0.06)', border: '1px solid rgba(45, 122, 80, 0.2)', borderRadius: 8 }}>
                <Lock size={14} weight="fill" color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Sicherheitsempfehlung:</strong>{' '}
                  Erstelle für diese Verbindung einen <strong>dedizierten API-Key mit minimalen Rechten</strong> (nur Lesen).
                  Verwende niemals dein Admin-Passwort. Zugangsdaten werden verschlüsselt gespeichert.
                </p>
              </div>
            )}
          </FormSection>

          {/* ── Abschnitt: Einstellungen ──────────────────────────── */}
          <FormSection label="Einstellungen">
            <FormField
              label="Abruf-Intervall"
              hint={
                form.fetchInterval === 0     ? 'Manuell: Daten werden nur abgerufen wenn du auf ▶ klickst.' :
                form.fetchInterval === 300   ? 'Alle 5 Minuten: Hohes Abfragevolumen – nur für Echtzeit-Daten sinnvoll.' :
                form.fetchInterval === 3600  ? 'Stündlich: Empfohlen für die meisten Datenquellen. Gute Balance aus Aktualität und Ressourcen.' :
                /* 86400 */                   'Täglich: Für Daten die sich selten ändern, z.B. wöchentliche Reports oder Stammdaten.'
              }
            >
              <select className="tdrawer-select" value={form.fetchInterval} onChange={(e) => f({ fetchInterval: Number(e.target.value) })}>
                {INTERVAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>

            <FormField
              label="JSON-Pfad"
              optional
              hint={
                <span>
                  Gibt an <em>wo in der API-Antwort</em> die eigentlichen Daten stehen.{' '}
                  <strong>Leer lassen</strong> wenn die API direkt eine Liste zurückgibt.{' '}
                  Nur ausfüllen wenn die Daten tiefer verschachtelt sind:
                  <span style={{ display: 'block', marginTop: 6, fontFamily: 'var(--font-mono, monospace)', fontSize: 11, background: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', lineHeight: 1.6 }}>
                    {'{'} &quot;status&quot;: &quot;ok&quot;, <strong>&quot;data&quot;</strong>: {'{'} <strong>&quot;items&quot;</strong>: [...]{'}'} {'}'}
                    {'\n'}→ JSON-Pfad: <strong>$.data.items</strong>
                  </span>
                </span>
              }
            >
              <input className="tdrawer-input" value={form.schemaPath}
                onChange={(e) => f({ schemaPath: e.target.value })}
                placeholder="Leer lassen oder z.B.: $.data.items" />
            </FormField>
          </FormSection>

        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving} aria-busy={saving}>
            {saving
              ? (editingId ? 'Speichern…' : 'Wird angelegt…')
              : (editingId ? 'Speichern' : 'Speichern & ersten Abruf starten')}
          </button>
        </div>
      </div>
    </div>
  )
}
