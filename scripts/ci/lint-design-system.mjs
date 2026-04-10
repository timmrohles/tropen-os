#!/usr/bin/env node
/**
 * lint-design-system.mjs
 * Tropen OS — Design System Enforcer
 *
 * Prüft alle .tsx/.ts Dateien in src/ gegen die Design-Konventionen aus CLAUDE.md.
 * Läuft in CI (GitHub Actions) und lokal via: node scripts/ci/lint-design-system.mjs
 *
 * Exit-Code 0 = alles ok
 * Exit-Code 1 = Errors gefunden (blockiert CI)
 * Exit-Code 0 + Warnings = Warnings gefunden (blockiert CI nicht)
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative, extname } from 'path'

// ─── Konfiguration ────────────────────────────────────────────────────────────

const ROOT = process.cwd()
const SRC  = join(ROOT, 'src')

// Dateien/Ordner die übersprungen werden
const IGNORE = [
  'node_modules', '.next', '.git', 'dist', 'build',
  '__tests__', '__mocks__', '.test.', '.spec.',
  'globals.css', 'globals.ts',
  // Ausnahmen: Dateien mit legitimem Hex-Einsatz
  'global-error.tsx',       // Error-Boundary — läuft vor CSS-Variablen
  'ParrotIcon.tsx',         // SVG Brand-Icon — CSS-Vars in fill nicht möglich
  '_DESIGN_REFERENCE.tsx',  // Zeigt bewusst verbotene Patterns als Negativbeispiele
  'db/schema.ts', 'db\\schema.ts',  // Drizzle-Schema — file-size ist strukturell bedingt
  'feeds/DataView.tsx', 'feeds\\DataView.tsx',  // Komplexe Feed-Datenansicht — Aufteilung Plan J1
  'feeds/page.tsx', 'feeds\\page.tsx',          // Feeds-Hauptseite — Aufteilung Plan J1
  // file-size: strukturell große Dateien — Aufteilung separates Ticket
  'todos/todoDataOps.ts', 'todos\\todoDataOps.ts',                          // Statische Todo-Daten
  'todos/todoDataFeatures.ts', 'todos\\todoDataFeatures.ts',                // Statische Todo-Daten
  'audit/_components/FindingsTable.tsx', 'audit\\_components\\FindingsTable.tsx',  // Komplexe Findings-UI
  'audit/_components/FixPreview.tsx', 'audit\\_components\\FixPreview.tsx',        // Fix-Vorschau-UI
  // file-size: Audit-Checker — Engine-Code, Aufteilung nach Architektur-Review
  'checkers/agent-committee-checker.ts', 'checkers\\agent-committee-checker.ts',
  'checkers/agent-regulatory-checker.ts', 'checkers\\agent-regulatory-checker.ts',
  'checkers/security-scan-checker.ts', 'checkers\\security-scan-checker.ts',
]

// Verbotene Hex-Farben (hardcodiert statt CSS-Variable)
// Quelle: globals.css :root — alle bekannten Farbwerte
const FORBIDDEN_HEX = [
  // Alte abgelöste Farben — nie verwenden
  { hex: '#a3b554', note: 'Altes Grün — verwende var(--accent) = #2D7A50' },
  { hex: '#b3c664', note: 'Altes Grün hover — verwende var(--accent-dark)' },
  { hex: '#0d1f16', note: 'Altes Dunkelgrün — verwende var(--active-bg)' },
  { hex: '#134e3a', note: 'Altes Dunkelgrün — verwende var(--accent-dark)' },
  { hex: '#14b8a6', note: 'Altes Türkis — komplett abgelöst, kein Ersatz' },
  { hex: '#89c4a8', note: 'Altes Hellgrün — verwende var(--accent-light)' },
  { hex: '#d4f0e4', note: 'Altes Hellgrün — verwende var(--accent-light)' },
  { hex: '#556b5a', note: 'Altes Grün — verwende var(--text-secondary)' },
  // Aktuelle Design-Token-Werte die als Hex hardcodiert werden könnten
  { hex: '#EAE9E5', note: 'Verwende var(--bg-base)' },
  { hex: '#eae9e5', note: 'Verwende var(--bg-base)' },
  { hex: '#1A1714', note: 'Verwende var(--text-primary)' },
  { hex: '#1a1714', note: 'Verwende var(--text-primary)' },
  { hex: '#4A4540', note: 'Verwende var(--text-secondary)' },
  { hex: '#4a4540', note: 'Verwende var(--text-secondary)' },
  { hex: '#6B6560', note: 'Verwende var(--text-tertiary)' },
  { hex: '#6b6560', note: 'Verwende var(--text-tertiary)' },
  { hex: '#2D7A50', note: 'Verwende var(--accent)' },
  { hex: '#2d7a50', note: 'Verwende var(--accent)' },
  { hex: '#1A2E23', note: 'Verwende var(--active-bg)' },
  { hex: '#1a2e23', note: 'Verwende var(--active-bg)' },
  { hex: '#D4EDDE', note: 'Verwende var(--accent-light)' },
  { hex: '#d4edde', note: 'Verwende var(--accent-light)' },
  { hex: '#C0392B', note: 'Verwende var(--error)' },
  { hex: '#c0392b', note: 'Verwende var(--error)' },
  { hex: '#C07A2A', note: 'Verwende var(--warning)' },
  { hex: '#c07a2a', note: 'Verwende var(--warning)' },
]

// Verbotene Icon-Libraries — nur @phosphor-icons/react erlaubt
const FORBIDDEN_ICON_IMPORTS = [
  { pattern: /from ['"]react-icons/,         note: 'Verwende @phosphor-icons/react' },
  { pattern: /from ['"]@heroicons/,           note: 'Verwende @phosphor-icons/react' },
  { pattern: /from ['"]lucide-react/,         note: 'Verwende @phosphor-icons/react' },
  { pattern: /from ['"]@radix-ui\/react-icons/, note: 'Verwende @phosphor-icons/react' },
  { pattern: /from ['"]feather-icons/,        note: 'Verwende @phosphor-icons/react' },
]

// Verbotene Inline-SVGs — nur @phosphor-icons/react erlaubt
// Ausnahme: ParrotIcon.tsx (Brand-SVG) ist in IGNORE-Liste
const FORBIDDEN_INLINE_SVG = {
  pattern: /<svg[\s>]/,
  note: 'Inline-SVG in Komponente — verwende @phosphor-icons/react statt Inline-SVGs',
  severity: 'error',
}

// Phosphor Icons: weight muss "bold" oder "fill" sein
// weight="duotone", weight="regular", weight="thin", weight="light" sind nicht erlaubt
const FORBIDDEN_ICON_WEIGHTS = [
  { pattern: /weight=["']duotone["']/,  note: 'Verwende weight="bold" oder weight="fill" — duotone ist nicht im Design System' },
  { pattern: /weight=["']regular["']/, note: 'Verwende weight="bold" oder weight="fill"' },
  { pattern: /weight=["']thin["']/,    note: 'Verwende weight="bold" oder weight="fill"' },
  { pattern: /weight=["']light["']/,   note: 'Verwende weight="bold" oder weight="fill"' },
]

// Löschen/Delete-Button muss dropdown-item--danger haben
// Prüft: wenn ein Button "Löschen" als Text hat, muss er dropdown-item--danger in der className haben
const DELETE_DANGER_PATTERN = {
  pattern: />\s*Löschen\s*</,
  note: 'Löschen-Button ohne dropdown-item--danger — Löschen immer in [···] Menü mit danger-Klasse',
  severity: 'warn',
  onlyIn: ['components', 'app'],
  // Ausnahme: Confirm-Texte (z.B. "Sicher löschen?"), oder danger ist auf der Zeile selbst
  exceptPatterns: [
    /dropdown-item--danger/,
    /btn-danger/,
    /Sicher löschen/,
    /wirklich löschen/i,
  ],
}

// Emoji als funktionale Icon-Platzhalter — kein 📁, ✅, 🔔 etc. als UI-Icons
// Hinweis: Emojis in Datenwerten (z.B. avatar.emoji) sind OK — dieses Muster prüft nur JSX-Expressions
const EMOJI_ICON_PATTERN = {
  // Gängige Funktions-Emojis als JSX-Literal
  pattern: /['"`>]\s*[📁✅❌🔔⚠️💡🎯📊📋🔍🗑️✏️💾📤📥🔗🎨🚀💬🧠]\s*['"`<]/u,
  note: 'Emoji als funktionales Icon im JSX — verwende @phosphor-icons/react statt Emoji',
  severity: 'warn',
  onlyIn: ['components', 'app'],
}

// Patterns die auf fehlende Design-System-Klassen hinweisen
// Nur in Komponenten- und Seiten-Dateien prüfen (nicht in lib/, services/)
const DESIGN_SYSTEM_PATTERNS = [
  {
    // Eigene Button-Styles statt .btn
    pattern: /<button(?![^>]*className=["'][^"']*\bbtn\b)/,
    note: 'Button ohne className="btn ..." — verwende btn btn-primary / btn-ghost / btn-danger / btn-icon',
    severity: 'warn',
    onlyIn: ['components', 'app'],
    // Ausnahmen: Buttons in Form-Primitiven, intern in Drawer-Mechanismen
    exceptPatterns: [
      /className=["'][^"']*btn/,  // hat schon btn-Klasse
      /btn-icon/,
      /<button\s+type=["']submit["']/,  // Submit-Buttons in Forms OK
    ],
  },
  {
    // Cards ohne .card Klasse
    pattern: /borderRadius[:\s]+['"]?\d+px|border-radius:\s*\d+/,
    note: 'Manueller border-radius in Komponente — verwende className="card" oder var(--radius-*)',
    severity: 'warn',
    onlyIn: ['components', 'app'],
  },
  {
    // Kein paddingTop/paddingBottom auf content-Wrapper nötig
    pattern: /className=["'][^"']*content-(max|narrow|wide)[^"']*["'][^>]*style=\{[^}]*padding(Top|Bottom)/,
    note: 'Manuelles paddingTop/paddingBottom auf content-Wrapper — content-max/narrow/wide enthalten das automatisch',
    severity: 'error',
    onlyIn: ['app'],
  },
  {
    // background auf Page-Wrapper (verhindert Body-Gradient)
    pattern: /className=["'][^"']*content-(max|narrow|wide|full)[^"']*["'][^>]*style=\{[^}]*background(?!Color)/,
    note: 'background auf content-Wrapper verhindert Body-Gradient — Page-Wrapper dürfen kein background setzen',
    severity: 'warn',
    onlyIn: ['app'],
  },
  DELETE_DANGER_PATTERN,
  EMOJI_ICON_PATTERN,
]

// console.log in Produktionsdateien
const CONSOLE_PATTERN = {
  pattern: /console\.(log|warn|error|info|debug)\s*\(/,
  note: 'console.log in Produktionscode — verwende src/lib/logger.ts',
  severity: 'warn',
  exceptions: ['logger.ts', 'logger.js', 'scripts/', '.test.', '.spec.', 'e2e/'],
}

// `any` ohne Begründungskommentar
const ANY_PATTERN = {
  pattern: /:\s*any(?:\s|;|,|\)|\[|>)/,
  note: 'TypeScript `any` ohne Begründung — füge Kommentar hinzu: // eslint-disable-next-line @typescript-eslint/no-explicit-any — [Begründung]',
  severity: 'warn',
  exceptions: ['.test.', '.spec.', 'd.ts'],
}

// Dateigrößen-Limits
const FILE_SIZE_WARN  = 300
const FILE_SIZE_ERROR = 500

// ─── Ergebnisse ──────────────────────────────────────────────────────────────

let errors   = 0
let warnings = 0
const results = []

function report(file, line, severity, rule, message, suggestion) {
  const rel = relative(ROOT, file)
  results.push({ file: rel, line, severity, rule, message, suggestion })
  if (severity === 'error') errors++
  else warnings++
}

// ─── Datei-Traversal ─────────────────────────────────────────────────────────

function shouldIgnore(filePath) {
  return IGNORE.some(pattern => filePath.includes(pattern))
}

function getAllFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (shouldIgnore(full)) continue
    const stat = statSync(full)
    if (stat.isDirectory()) {
      getAllFiles(full, files)
    } else if (['.tsx', '.ts', '.jsx', '.js'].includes(extname(full))) {
      files.push(full)
    }
  }
  return files
}

// supabaseAdmin ohne organization_id in API-Routes
// Heuristik: Routes in src/app/api/ die supabaseAdmin.from() verwenden müssen
// Tenant-Isolation haben — via organization_id-Filter, user_id-Scope oder Access-Guard-Helper.
// Warnt einmal pro Datei wenn gar keine dieser Isolation-Signale vorhanden sind.
// Ausnahmen (scope-unabhängig by design): Cron, Admin, Superadmin, Public, Library, Health
const SUPABASE_ADMIN_ORG_EXCEPTIONS = [
  '/api/cron/',       'api\\cron\\',
  '/api/admin/',      'api\\admin\\',
  '/api/superadmin/', 'api\\superadmin\\',
  '/api/public/',     'api\\public\\',
  '/api/library/',    'api\\library\\',
  '/api/health',      'api\\health',
]

function checkSupabaseAdminOrgIsolation(filePath, content, lines, rel) {
  // Nur API-Routes prüfen
  if (!rel.includes('/api/') && !rel.includes('\\api\\')) return

  // Bekannte Ausnahmen überspringen
  if (SUPABASE_ADMIN_ORG_EXCEPTIONS.some(e => rel.includes(e))) return

  // Datei verwendet kein supabaseAdmin.from() → kein Check nötig
  if (!content.includes('supabaseAdmin.from(')) return

  // Isolation-Signale im gesamten File prüfen
  const hasOrgFilter   = content.includes('organization_id')
  const hasUserScope   = content.includes(".eq('user_id'") ||
                         content.includes('.eq("user_id"') ||
                         content.includes('user_id:')
  const hasAccessGuard = content.includes('requireWorkspaceAccess') ||
                         content.includes('verifyProjectAccess') ||
                         content.includes('canWriteWorkspace') ||
                         content.includes('requireOrgAdmin') ||
                         content.includes('requireSuperadmin')

  if (!hasOrgFilter && !hasUserScope && !hasAccessGuard) {
    // Zeile der ersten supabaseAdmin.from()-Verwendung melden
    const firstLine = lines.findIndex(l => l.includes('supabaseAdmin.from(')) + 1
    report(filePath, firstLine, 'warn', 'supabase-admin-no-org',
      'supabaseAdmin.from() ohne Tenant-Isolation (kein organization_id, user_id-Scope oder Access-Guard im File)',
      'organization_id-Filter, .eq("user_id", ...) oder Access-Guard (requireWorkspaceAccess, verifyProjectAccess) hinzufügen. Ausnahmen: Cron/Admin/Superadmin/Public sind bewusst global.')
  }
}

// ─── Checks ──────────────────────────────────────────────────────────────────

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf8')
  const lines   = content.split('\n')
  const rel     = relative(ROOT, filePath)

  // Dateigrößen-Check
  if (lines.length > FILE_SIZE_ERROR) {
    report(filePath, lines.length, 'error', 'file-size',
      `Datei hat ${lines.length} Zeilen (Limit: ${FILE_SIZE_ERROR})`,
      'Datei aufteilen — Services max. 300 Zeilen, Komponenten max. 200 Zeilen')
  } else if (lines.length > FILE_SIZE_WARN) {
    report(filePath, lines.length, 'warn', 'file-size',
      `Datei hat ${lines.length} Zeilen (Warnung ab ${FILE_SIZE_WARN})`,
      'Prüfen ob Aufteilen sinnvoll ist')
  }

  lines.forEach((line, idx) => {
    const lineNum = idx + 1
    const trimmed = line.trim()
    const prevLine = idx > 0 ? lines[idx - 1].trim() : ''
    const hasLintDisable = prevLine.includes('eslint-disable') || line.includes('// eslint-disable')

    // Kommentarzeilen überspringen
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return

    // ── Verbotene Hex-Farben ──────────────────────────────────────────────────
    if (!hasLintDisable) {
      for (const { hex, note } of FORBIDDEN_HEX) {
        // In Tailwind bg-[#...] oder als String oder als CSS-Property
        const escaped = hex.replace('#', '[#\\[]?')
        // Einfacher: direkter String-Match (case-sensitive bereits in der Liste)
        if (line.includes(hex) || line.includes(hex.toLowerCase())) {
          // Ausnahme: in Kommentaren
          if (!trimmed.startsWith('//') && !trimmed.startsWith('*')) {
            report(filePath, lineNum, 'error', 'forbidden-color',
              `Verbotene Farbe ${hex} gefunden`,
              note)
          }
        }
      }
    }

    // ── Verbotene Inline-SVGs ─────────────────────────────────────────────────
    if (!hasLintDisable && FORBIDDEN_INLINE_SVG.pattern.test(line)) {
      report(filePath, lineNum, FORBIDDEN_INLINE_SVG.severity, 'inline-svg',
        `Inline-SVG gefunden: ${trimmed.substring(0, 80)}`,
        FORBIDDEN_INLINE_SVG.note)
    }

    // ── Verbotene Icon-Imports ────────────────────────────────────────────────
    for (const { pattern, note } of FORBIDDEN_ICON_IMPORTS) {
      if (pattern.test(line)) {
        report(filePath, lineNum, 'error', 'forbidden-icon-library',
          `Verbotene Icon-Library: ${line.trim()}`,
          note)
      }
    }

    // ── Verbotene Icon Weights ────────────────────────────────────────────────
    // Nur in Dateien die Phosphor Icons importieren
    if (content.includes('@phosphor-icons')) {
      for (const { pattern, note } of FORBIDDEN_ICON_WEIGHTS) {
        if (pattern.test(line)) {
          report(filePath, lineNum, 'error', 'icon-weight',
            `Falsches Icon-Weight: ${line.trim()}`,
            note)
        }
      }
    }

    // ── console.log ───────────────────────────────────────────────────────────
    if (CONSOLE_PATTERN.pattern.test(line)) {
      const isException = CONSOLE_PATTERN.exceptions.some(e => rel.includes(e))
      if (!isException) {
        report(filePath, lineNum, CONSOLE_PATTERN.severity, 'console-log',
          `${line.trim()}`,
          CONSOLE_PATTERN.note)
      }
    }

    // ── TypeScript `any` ──────────────────────────────────────────────────────
    if (ANY_PATTERN.pattern.test(line)) {
      const isException = ANY_PATTERN.exceptions.some(e => rel.includes(e))
      // Prüfen ob auf der vorherigen Zeile ein eslint-disable Kommentar steht
      const prevLine = idx > 0 ? lines[idx - 1].trim() : ''
      const hasDisableComment = prevLine.includes('eslint-disable') ||
                                 line.includes('// eslint-disable')
      if (!isException && !hasDisableComment) {
        report(filePath, lineNum, ANY_PATTERN.severity, 'typescript-any',
          `TypeScript \`any\` ohne Begründung: ${trimmed.substring(0, 80)}`,
          ANY_PATTERN.note)
      }
    }
  })

  // ── supabaseAdmin Org-Isolation (API-Routes) ─────────────────────────────
  checkSupabaseAdminOrgIsolation(filePath, content, lines, rel)

  // ── Design-System-Patterns (Mehrzeilen-Context) ───────────────────────────
  const isComponent = rel.includes('/components/') || rel.includes('/app/')
  const isApp       = rel.includes('/app/')

  for (const check of DESIGN_SYSTEM_PATTERNS) {
    const inScope = !check.onlyIn ||
      (check.onlyIn.includes('components') && rel.includes('/components/')) ||
      (check.onlyIn.includes('app') && rel.includes('/app/'))

    if (!inScope) continue

    lines.forEach((line, idx) => {
      if (!check.pattern.test(line)) return

      // Ausnahmen prüfen
      if (check.exceptPatterns?.some(p => p.test(line))) return

      report(filePath, idx + 1, check.severity, 'design-system',
        check.note,
        'Siehe CLAUDE.md → Komponenten-Patterns')
    })
  }
}

// ─── Ausführung ──────────────────────────────────────────────────────────────

console.log('\n🎨 Tropen OS — Design System Lint\n')

if (!statSync(SRC, { throwIfNoEntry: false })) {
  console.error(`❌ src/ Verzeichnis nicht gefunden: ${SRC}`)
  process.exit(1)
}

const files = getAllFiles(SRC)
console.log(`📁 ${files.length} Dateien geprüft\n`)

for (const file of files) {
  checkFile(file)
}

// ─── Ausgabe ─────────────────────────────────────────────────────────────────

if (results.length === 0) {
  console.log('✅ Keine Design-System-Verletzungen gefunden.\n')
  process.exit(0)
}

// Gruppiert nach Datei ausgeben
const byFile = {}
for (const r of results) {
  if (!byFile[r.file]) byFile[r.file] = []
  byFile[r.file].push(r)
}

for (const [file, issues] of Object.entries(byFile)) {
  console.log(`\n📄 ${file}`)
  for (const issue of issues) {
    const icon     = issue.severity === 'error' ? '❌' : '⚠️ '
    const location = `  ${icon} Zeile ${String(issue.line).padStart(4)} [${issue.rule}]`
    console.log(location)
    console.log(`       ${issue.message}`)
    if (issue.suggestion) {
      console.log(`       💡 ${issue.suggestion}`)
    }
  }
}

// Zusammenfassung
console.log('\n─────────────────────────────────────────────────────')
console.log(`  ❌ Errors:   ${errors}   (blockieren CI)`)
console.log(`  ⚠️  Warnings: ${warnings}  (blockieren CI nicht)`)
console.log('─────────────────────────────────────────────────────\n')

if (errors > 0) {
  console.log('🚨 CI blockiert — bitte Errors beheben.\n')
  process.exit(1)
} else {
  console.log('✅ Keine Errors. Warnings bitte zeitnah beheben.\n')
  process.exit(0)
}

// Lokal ausführen mit:
// pnpm lint:design
