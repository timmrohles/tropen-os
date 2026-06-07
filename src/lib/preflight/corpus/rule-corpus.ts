// src/lib/preflight/corpus/rule-corpus.ts
//
// Hand-kuratierter Starter-Regelkorpus (Seed). Universeller Baseline —
// keine projektspezifischen Inhalte. Regeln sind imperativ, konkret, kurz.
// `appliesWhen` undefiniert = universell; gesetzt = bedingt.
import type { ConventionRule } from './types'

export const RULE_CORPUS: ConventionRule[] = [
  // ── code-rules (universell, ≥3) ──
  { id: 'code-file-size', section: 'code-rules', rule: 'Dateien > 300 Zeilen sind eine Warnung, > 500 eine Verletzung — aufteilen.', rationale: 'Lesbarkeit & Wartbarkeit', severity: 'must', source: 'claude-md' },
  { id: 'code-no-any', section: 'code-rules', rule: 'Kein `any` ohne Kommentar mit Begründung; TypeScript strict aktivieren.', severity: 'must', source: 'claude-md' },
  { id: 'code-no-logic-in-ui', section: 'code-rules', rule: 'Keine Business-Logik in UI-Komponenten oder Seiten — in /lib oder /actions auslagern.', severity: 'must', source: 'claude-md' },
  { id: 'code-no-dead-code', section: 'code-rules', rule: 'Auskommentierten Code und ungenutzte Importe entfernen statt liegen lassen.', severity: 'should', source: 'agent:CODE_STYLE' },
  { id: 'code-single-responsibility', section: 'code-rules', rule: 'Eine Funktion erledigt genau eine Aufgabe — bei mehreren Aufgaben aufteilen.', severity: 'should', source: 'agent:CODE_STYLE' },
  { id: 'code-no-magic-numbers', section: 'code-rules', rule: 'Magische Zahlen und Strings als benannte Konstanten extrahieren.', severity: 'should', source: 'agent:CODE_STYLE' },
  { id: 'code-pure-functions', section: 'code-rules', rule: 'Reine Funktionen bevorzugen — Seiteneffekte explizit und gebündelt halten.', severity: 'should', source: 'agent:ARCHITECTURE' },
  { id: 'code-semantic-html', section: 'code-rules', rule: '<button> für Aktionen, <a href> für Navigation — nie <div onClick>.', severity: 'should', source: 'agent:ACCESSIBILITY' },

  // ── naming (universell, ≥3) ──
  { id: 'name-components', section: 'naming', rule: 'React-Komponenten PascalCase benennen (UserProfile.tsx).', severity: 'must', source: 'claude-md' },
  { id: 'name-hooks', section: 'naming', rule: 'Custom Hooks camelCase mit use-Präfix benennen (useUserProfile.ts).', severity: 'must', source: 'claude-md' },
  { id: 'name-consts', section: 'naming', rule: 'Konstanten-Werte in UPPER_SNAKE_CASE benennen (MAX_RETRY_COUNT).', severity: 'should', source: 'claude-md' },
  { id: 'name-folders', section: 'naming', rule: 'Ordner in kebab-case benennen (user-management/).', severity: 'should', source: 'claude-md' },
  { id: 'name-utils', section: 'naming', rule: 'Utilities und Helper in camelCase benennen (formatDate.ts).', severity: 'should', source: 'claude-md' },
  { id: 'name-descriptive', section: 'naming', rule: 'Namen beschreiben Absicht, nicht Implementierung — keine Abkürzungen wie d, tmp, x.', severity: 'should', source: 'agent:CODE_STYLE' },
  { id: 'name-booleans', section: 'naming', rule: 'Boolean-Variablen mit is/has/should-Präfix benennen (isLoading, hasError).', severity: 'should', source: 'agent:CODE_STYLE' },

  // ── structure (universell, ≥3) ──
  { id: 'struct-layers', section: 'structure', rule: 'Klare Schichten trennen: UI (components) / Logik (lib, actions) / Daten (db).', severity: 'must', source: 'claude-md' },
  { id: 'struct-routing-only', section: 'structure', rule: 'Routing-Ordner enthalten nur Routing — kein Business-Code.', severity: 'should', source: 'claude-md' },
  { id: 'struct-colocate', section: 'structure', rule: 'Was zusammen geändert wird, liegt zusammen — nach Verantwortung schneiden, nicht nach technischem Layer.', severity: 'should', source: 'agent:ARCHITECTURE' },
  { id: 'struct-no-deep-nesting', section: 'structure', rule: 'Ordnertiefe begrenzen — bei mehr als drei Ebenen flacher umstrukturieren.', severity: 'should', source: 'agent:ARCHITECTURE' },
  { id: 'struct-barrel-exports', section: 'structure', rule: 'Öffentliche API eines Moduls über einen index-Export bündeln, Internas privat halten.', severity: 'should', source: 'agent:ARCHITECTURE' },

  // ── error-handling (universell, ≥3) ──
  { id: 'err-typed', section: 'error-handling', rule: 'Standardisierte Error-Typen verwenden statt roher throws.', severity: 'must', source: 'claude-md' },
  { id: 'err-try-catch-routes', section: 'error-handling', rule: 'API-Routen in try/catch kapseln und strukturierte JSON-Response { error, code? } liefern.', severity: 'must', source: 'claude-md' },
  { id: 'err-no-generic', section: 'error-handling', rule: 'Nie generische Messages an den Client geben — spezifisch und hilfreich formulieren.', severity: 'should', source: 'claude-md' },
  { id: 'err-no-empty-catch', section: 'error-handling', rule: 'Keine leeren catch-Blöcke — Fehler loggen oder gezielt behandeln.', severity: 'must', source: 'agent:ERROR_HANDLING' },
  { id: 'err-fail-fast', section: 'error-handling', rule: 'Ungültige Eingaben früh abweisen (fail fast) statt durch die Logik schleifen lassen.', severity: 'should', source: 'agent:ERROR_HANDLING' },
  { id: 'err-preserve-cause', section: 'error-handling', rule: 'Beim Weiterwerfen die ursprüngliche Fehlerursache erhalten (cause), nicht verschlucken.', severity: 'should', source: 'agent:ERROR_HANDLING' },

  // ── security (universell, ≥3) ──
  { id: 'sec-no-secrets', section: 'security', rule: 'Keine Secrets im Code oder in der Git-History ablegen.', severity: 'must', source: 'claude-md' },
  { id: 'sec-authcheck-first', section: 'security', rule: 'Auth-Check als erste Zeile jeder geschützten Route ausführen.', severity: 'must', source: 'claude-md' },
  { id: 'sec-no-pii-logs', section: 'security', rule: 'Kein PII in Logs schreiben; structured logging statt console.log nutzen.', severity: 'should', source: 'claude-md' },
  { id: 'sec-validate-input', section: 'security', rule: 'Eingaben serverseitig validieren (z.B. Zod) vor jeder Business-Logik.', severity: 'must', source: 'agent:SECURITY' },
  { id: 'sec-env-vars', section: 'security', rule: 'Konfiguration und Secrets über Environment-Variablen laden, nie hartkodieren.', severity: 'must', source: 'agent:SECURITY' },
  { id: 'sec-least-privilege', section: 'security', rule: 'Geringste nötige Berechtigung vergeben — Service-Keys nie an den Client geben.', severity: 'should', source: 'agent:SECURITY' },

  // ── maintenance (universell, ≥3) ──
  { id: 'maint-keep-current', section: 'maintenance', rule: 'Diese Konventionsdatei aktuell halten, wenn sich Regeln ändern.', severity: 'must', source: 'claude-md' },
  { id: 'maint-no-delete-sections', section: 'maintenance', rule: 'Bestehende Regeln nicht ohne Begründung entfernen.', severity: 'should', source: 'claude-md' },
  { id: 'maint-size', section: 'maintenance', rule: 'Datei fokussiert halten — wächst sie zu stark, in Themen-Dateien aufteilen.', severity: 'should', source: 'claude-md' },
  { id: 'maint-deps-current', section: 'maintenance', rule: 'Abhängigkeiten regelmäßig aktualisieren und auf bekannte CVEs prüfen.', severity: 'should', source: 'agent:DEPENDENCIES' },
  { id: 'maint-no-todo-rot', section: 'maintenance', rule: 'TODO/FIXME mit Kontext oder Ticket versehen — keine anonymen Marker liegen lassen.', severity: 'should', source: 'agent:CODE_STYLE' },

  // ── db (alle bedingt) ──
  { id: 'db-no-frontend-access', section: 'db', rule: 'Kein direkter DB-Zugriff aus dem Frontend — immer über eine Server-Schicht.', appliesWhen: ['db:true'], severity: 'must', source: 'claude-md' },
  { id: 'db-migrations-versioned', section: 'db', rule: 'Schema-Änderungen zuerst als versionierte Migrationsdatei committen, dann anwenden.', appliesWhen: ['db:true'], severity: 'must', source: 'claude-md' },
  { id: 'db-rls', section: 'db', rule: 'Row-Level-Security bzw. Tenant-Filter auf jeder mandantenbezogenen Tabelle erzwingen.', appliesWhen: ['db:true'], severity: 'must', source: 'agent:DATABASE' },
  { id: 'db-no-select-star', section: 'db', rule: 'Nur benötigte Spalten selektieren statt SELECT * über breite Tabellen.', appliesWhen: ['db:true'], severity: 'should', source: 'agent:DATABASE' },
  { id: 'db-index-foreign-keys', section: 'db', rule: 'Fremdschlüssel und häufig gefilterte Spalten indizieren.', appliesWhen: ['db:true'], severity: 'should', source: 'agent:DATABASE' },
  { id: 'db-no-n-plus-1', section: 'db', rule: 'N+1-Queries vermeiden — Daten gebündelt laden (join/batch) statt im Loop.', appliesWhen: ['db:true'], severity: 'should', source: 'agent:PERFORMANCE' },

  // ── bedingt: react ──
  { id: 'react-no-fetch-in-effect', section: 'code-rules', rule: 'Kein Daten-Fetch direkt in useEffect ohne Abbruch/Dedupe — Server Components oder Query-Layer bevorzugen.', appliesWhen: ['stack:react'], severity: 'should', source: 'agent:PERFORMANCE' },
  { id: 'react-keys', section: 'code-rules', rule: 'Stabile keys in Listen verwenden — nie der Array-Index bei dynamischen Listen.', appliesWhen: ['stack:react'], severity: 'should', source: 'agent:CODE_STYLE' },
  { id: 'react-no-derived-state', section: 'code-rules', rule: 'Ableitbare Werte direkt im Render berechnen statt redundant im State zu spiegeln.', appliesWhen: ['stack:react'], severity: 'should', source: 'agent:CODE_STYLE' },

  // ── bedingt: next ──
  { id: 'next-server-components-default', section: 'structure', rule: "Server Components als Default — 'use client' nur dort, wo Interaktivität nötig ist.", appliesWhen: ['stack:next'], severity: 'should', source: 'agent:ARCHITECTURE' },
  { id: 'next-no-secrets-client', section: 'security', rule: 'Server-Secrets nie in Client Components importieren oder über NEXT_PUBLIC_ exponieren.', appliesWhen: ['stack:next'], severity: 'must', source: 'agent:SECURITY' },

  // ── bedingt: auth ──
  { id: 'auth-session-check', section: 'security', rule: 'Session/Token serverseitig prüfen — nie nur clientseitig verstecken.', appliesWhen: ['auth:true'], severity: 'must', source: 'agent:SECURITY' },
  { id: 'auth-no-token-logs', section: 'security', rule: 'Tokens, Passwörter und Session-IDs niemals loggen oder in URLs weitergeben.', appliesWhen: ['auth:true'], severity: 'must', source: 'agent:SECURITY' },

  // ── bedingt: web ──
  { id: 'web-a11y-basics', section: 'code-rules', rule: 'Fokus-Indikator sichtbar halten, Tastatur-Bedienbarkeit sicherstellen, aria-label für Icon-Buttons setzen.', appliesWhen: ['platform:web'], severity: 'should', source: 'agent:ACCESSIBILITY' },
  { id: 'web-loading-states', section: 'code-rules', rule: 'Lade- und Fehlerzustände für asynchrone UI explizit rendern.', appliesWhen: ['platform:web'], severity: 'should', source: 'agent:DESIGN_SYSTEM' },

  // ── bedingt: native ──
  { id: 'native-no-blocking-main', section: 'code-rules', rule: 'Schwere Arbeit nicht im Main/UI-Thread ausführen — auslagern, um die UI flüssig zu halten.', appliesWhen: ['platform:native'], severity: 'should', source: 'agent:PERFORMANCE' },

  // ── bedingt: commerce ──
  { id: 'commerce-no-card-data', section: 'security', rule: 'Niemals Karten- oder Zahlungsdaten selbst speichern — einen PSP (Stripe o.ä.) nutzen.', appliesWhen: ['commerce:true'], severity: 'must', source: 'agent:LEGAL' },
  { id: 'commerce-verify-amount-server', section: 'security', rule: 'Preise und Beträge serverseitig berechnen und verifizieren — nie dem Client-Wert vertrauen.', appliesWhen: ['commerce:true'], severity: 'must', source: 'agent:SECURITY' },
]
