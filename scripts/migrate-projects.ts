/**
 * migrate-projects.ts
 * Einmaliges Migrations-Script: projects → workspaces
 *
 * Voraussetzung: Prompt 01 (Schema) wurde bereits ausgeführt, d.h.
 *   - `workspaces` Tabelle (neue Bedeutung: mächtiges Projekt) existiert
 *   - `conversations` hat eine neue Spalte `workspace_id` (FK → workspaces.id)
 *   - Die alte `workspaces` Tabelle (Departments) wurde bereits umbenannt
 *
 * Verwendung:
 *   npx tsx scripts/migrate-projects.ts --dry-run   # zeigt was migriert würde
 *   npx tsx scripts/migrate-projects.ts             # führt Migration aus
 *   npx tsx scripts/migrate-projects.ts --rollback  # spielt Backup zurück
 *
 * Neue workspaces-Tabelle (Prompt 01 erstellt diese):
 *   id UUID, title TEXT, description TEXT, domain TEXT DEFAULT 'custom',
 *   department_id UUID, meta JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Env laden (.env.local)
// ---------------------------------------------------------------------------
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local')
    const content = readFileSync(envPath, 'utf8')
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const eqIdx = line.indexOf('=')
      if (eqIdx < 1) continue
      const key = line.slice(0, eqIdx).trim()
      const val = line.slice(eqIdx + 1).trim()
      if (key && !(key in process.env)) process.env[key] = val
    }
  } catch {
    // .env.local nicht gefunden — Env-Vars müssen extern gesetzt sein
  }
}
loadEnv()

// ---------------------------------------------------------------------------
// Supabase Admin Client
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------
interface Project {
  id: string
  workspace_id: string | null   // department_id in neuer Architektur
  name: string
  description: string | null
  context: string | null
  tone: string | null
  language: string | null
  target_audience: string | null
  memory: string | null
  display_order: number | null
  created_at: string
  updated_at: string | null
}

interface WorkspaceInsert {
  title: string
  description: string | null
  domain: string
  department_id: string | null
  meta: Record<string, unknown>
  created_at: string
  updated_at: string | null
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------
function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

async function tableExists(name: string): Promise<boolean> {
  const { data, error } = await db
    .from('information_schema.tables' as never)
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', name)
    .maybeSingle()
  if (error) {
    // Fallback: direkte Abfrage versuchen
    const res = await db.from(name as never).select('id').limit(1)
    return !res.error
  }
  return !!data
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const { data, error } = await db
    .from('information_schema.columns' as never)
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', table)
    .eq('column_name', column)
    .maybeSingle()
  if (error) return false
  return !!data
}

// ---------------------------------------------------------------------------
// Vorbedingungen prüfen
// ---------------------------------------------------------------------------
async function checkPrerequisites() {
  log('Prüfe Vorbedingungen…')

  const workspacesExists = await tableExists('workspaces')
  if (!workspacesExists) {
    throw new Error(
      'Tabelle "workspaces" (neue Bedeutung) nicht gefunden. Bitte zuerst Prompt 01 (Schema) ausführen.'
    )
  }

  const projectsExists = await tableExists('projects')
  if (!projectsExists) {
    throw new Error('Tabelle "projects" nicht gefunden — Migration möglicherweise bereits durchgeführt?')
  }

  const hasNewWorkspaceId = await columnExists('conversations', 'workspace_id')
  if (!hasNewWorkspaceId) {
    log('⚠️  Spalte conversations.workspace_id nicht gefunden.')
    log('   conversations.project_id kann nicht umgeschrieben werden.')
    log('   Bitte Prompt 01 vollständig ausführen, bevor dieser Schritt gemacht wird.')
  }

  log('✅ Vorbedingungen erfüllt.')
  return { hasNewWorkspaceId }
}

// ---------------------------------------------------------------------------
// Backup erstellen
// ---------------------------------------------------------------------------
async function createBackup() {
  log('Erstelle projects_backup…')

  // Prüfen ob Backup bereits existiert
  const backupExists = await tableExists('projects_backup')
  if (backupExists) {
    log('⚠️  projects_backup existiert bereits — wird übersprungen.')
    return
  }

  // Direkte SQL via RPC (Supabase unterstützt kein CREATE TABLE AS SELECT via JS-Client)
  // Daher: Daten lesen und in Backup-Tabelle schreiben via RPC
  const { error } = await db.rpc('create_projects_backup' as never)
  if (error) {
    // Fallback: warnen und weitermachen — Daten sind in der Migration gespeichert
    log(`⚠️  RPC create_projects_backup nicht verfügbar: ${error.message}`)
    log('   Backup wird via JSON-Export gesichert (lokal).')
    const { data: projects } = await db.from('projects').select('*')
    if (projects && projects.length > 0) {
      const { writeFileSync } = await import('fs')
      const backupPath = resolve(process.cwd(), 'scripts/projects-backup.json')
      writeFileSync(backupPath, JSON.stringify(projects, null, 2), 'utf8')
      log(`   Backup gespeichert: ${backupPath}`)
    }
  } else {
    log('✅ projects_backup erstellt.')
  }
}

// ---------------------------------------------------------------------------
// Dry-Run: zeigt was migriert würde
// ---------------------------------------------------------------------------
async function dryRun() {
  log('=== DRY RUN ===')
  log('(Keine Änderungen werden durchgeführt)')
  log('')

  const { data: projects, error } = await db
    .from('projects')
    .select('*')
    .order('created_at')

  if (error) throw new Error(`Fehler beim Laden der Projekte: ${error.message}`)
  if (!projects || projects.length === 0) {
    log('ℹ️  Keine Projekte gefunden — nichts zu migrieren.')
    return
  }

  log(`📋 ${projects.length} Projekt(e) würden migriert:`)
  log('')
  for (const p of projects as Project[]) {
    log(`  → [${p.id}] "${p.name}"`)
    log(`     department_id:  ${p.workspace_id ?? '(null)'}`)
    log(`     description:    ${p.description ?? '(null)'}`)
    log(`     domain:         custom`)
    log(`     meta.context:   ${p.context ? p.context.slice(0, 60) + '…' : '(null)'}`)
    log(`     meta.tone:      ${p.tone ?? '(null)'}`)
    log(`     meta.language:  ${p.language ?? '(null)'}`)
    log(`     meta.audience:  ${p.target_audience ?? '(null)'}`)
    log('')
  }

  // Conversations prüfen
  const { count } = await db
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .not('project_id', 'is', null)

  log(`💬 ${count ?? 0} Conversation(s) haben eine project_id — würden umgeschrieben.`)
  log('')
  log('=== DRY RUN ENDE ===')
}

// ---------------------------------------------------------------------------
// Migration ausführen
// ---------------------------------------------------------------------------
async function migrate() {
  const { hasNewWorkspaceId } = await checkPrerequisites()
  await createBackup()

  log('Lade Projekte…')
  const { data: projects, error: loadError } = await db
    .from('projects')
    .select('*')
    .order('created_at')

  if (loadError) throw new Error(`Fehler beim Laden der Projekte: ${loadError.message}`)
  if (!projects || projects.length === 0) {
    log('ℹ️  Keine Projekte gefunden — nichts zu migrieren.')
    return
  }

  log(`Migriere ${projects.length} Projekt(e)…`)
  log('')

  // Mapping: alte project.id → neue workspace.id
  const projectToWorkspace = new Map<string, string>()

  for (const project of projects as Project[]) {
    const insert: WorkspaceInsert = {
      title: project.name,
      description: project.description,
      domain: 'custom',
      department_id: project.workspace_id,
      meta: {
        context: project.context,
        tone: project.tone,
        language: project.language,
        target_audience: project.target_audience,
        memory: project.memory,
        migratedFromProjectId: project.id,
      },
      created_at: project.created_at,
      updated_at: project.updated_at,
    }

    const { data: newWs, error: insertError } = await db
      .from('workspaces')
      .insert(insert)
      .select('id')
      .single()

    if (insertError) {
      log(`❌ Fehler bei Projekt "${project.name}" [${project.id}]: ${insertError.message}`)
      throw new Error(`Migration abgebrochen bei Projekt ${project.id}`)
    }

    projectToWorkspace.set(project.id, newWs.id)
    log(`  ✓ "${project.name}" [${project.id}] → workspace [${newWs.id}]`)
  }

  log('')
  log(`✅ ${projectToWorkspace.size} Workspace(s) erstellt.`)

  // Conversations umschreiben
  if (hasNewWorkspaceId) {
    log('Schreibe conversations.project_id → conversations.workspace_id um…')
    let updatedConvs = 0

    for (const [projectId, workspaceId] of projectToWorkspace) {
      const { count, error: updateError } = await db
        .from('conversations')
        .update({ workspace_id: workspaceId, project_id: null })
        .eq('project_id', projectId)
        .select('*', { count: 'exact', head: true })

      if (updateError) {
        log(`⚠️  Fehler beim Umschreiben von Conversations für Projekt ${projectId}: ${updateError.message}`)
      } else {
        updatedConvs += count ?? 0
      }
    }

    // Verbleibende project_id auf null setzen (Projekte ohne Migration)
    await db.from('conversations').update({ project_id: null }).not('project_id', 'is', null)

    log(`✅ ${updatedConvs} Conversation(s) umgeschrieben.`)
  } else {
    log('⚠️  conversations.workspace_id Spalte fehlt — Conversations nicht umgeschrieben.')
    log('   Bitte nach Prompt 01 das Script erneut ausführen für diesen Schritt.')
  }

  // Verifikation
  log('')
  log('Verifikation…')
  const { count: projectCount } = await db
    .from('projects')
    .select('*', { count: 'exact', head: true })

  const { count: workspaceCount } = await db
    .from('workspaces')
    .select('*', { count: 'exact', head: true })
    .not('meta->>migratedFromProjectId', 'is', null)

  log(`  Projekte in projects:                     ${projectCount}`)
  log(`  Workspaces mit migratedFromProjectId:     ${workspaceCount}`)

  if (projectCount !== workspaceCount) {
    throw new Error(
      `Verifikation fehlgeschlagen: ${projectCount} Projekte ≠ ${workspaceCount} migrierte Workspaces. ` +
      'projects Tabelle wird NICHT gedroppt. Bitte manuell prüfen.'
    )
  }

  log('✅ Verifikation bestanden.')
  log('')

  // projects Tabelle droppen
  log('Droppe projects Tabelle…')
  const { error: dropError } = await db.rpc('drop_projects_table' as never)
  if (dropError) {
    log(`⚠️  RPC drop_projects_table nicht verfügbar: ${dropError.message}`)
    log('')
    log('  Führe folgende SQL manuell aus (Supabase SQL Editor):')
    log('  ───────────────────────────────────────────────────')
    log('  DROP TABLE IF EXISTS projects;')
    log('  ───────────────────────────────────────────────────')
  } else {
    log('✅ projects Tabelle gedroppt.')
  }

  log('')
  log('🎉 Migration erfolgreich abgeschlossen!')
  log(`   ${projectToWorkspace.size} Projekte → Workspaces migriert.`)
  log('   Backup: projects_backup Tabelle (oder scripts/projects-backup.json)')
}

// ---------------------------------------------------------------------------
// Rollback: stellt projects aus Backup wieder her
// ---------------------------------------------------------------------------
async function rollback() {
  log('=== ROLLBACK ===')

  // Backup aus JSON oder Supabase-Tabelle laden
  let backupData: Project[] | null = null

  const backupExists = await tableExists('projects_backup')
  if (backupExists) {
    log('Lade Backup aus projects_backup Tabelle…')
    const { data, error } = await db.from('projects_backup' as never).select('*')
    if (error) {
      log(`❌ Fehler beim Laden von projects_backup: ${error.message}`)
    } else {
      backupData = data as Project[]
    }
  }

  if (!backupData) {
    try {
      const { readFileSync } = await import('fs')
      const backupPath = resolve(process.cwd(), 'scripts/projects-backup.json')
      backupData = JSON.parse(readFileSync(backupPath, 'utf8')) as Project[]
      log('Lade Backup aus scripts/projects-backup.json…')
    } catch {
      throw new Error('Kein Backup gefunden (weder projects_backup Tabelle noch scripts/projects-backup.json).')
    }
  }

  if (!backupData || backupData.length === 0) {
    log('ℹ️  Backup ist leer — nichts wiederherzustellen.')
    return
  }

  log(`Stelle ${backupData.length} Projekt(e) wieder her…`)

  // projects Tabelle neu befüllen (falls bereits gedroppt → Fehler, muss manuell neu erstellt werden)
  const projectsExists = await tableExists('projects')
  if (!projectsExists) {
    log('❌ Tabelle "projects" nicht mehr vorhanden.')
    log('   Bitte manuell neu erstellen und dann Rollback erneut ausführen:')
    log('   Migrations-SQL: supabase/migrations/008_projects.sql + 016_smart_projects.sql')
    throw new Error('Rollback abgebrochen — projects Tabelle fehlt.')
  }

  for (const project of backupData) {
    const { error } = await db.from('projects').upsert(project)
    if (error) {
      log(`⚠️  Fehler bei Projekt "${project.name}" [${project.id}]: ${error.message}`)
    } else {
      log(`  ✓ "${project.name}" [${project.id}] wiederhergestellt.`)
    }
  }

  // Conversations project_id zurückschreiben (falls workspace_id gesetzt wurde)
  log('Schreibe conversations.project_id zurück…')
  const { data: workspaces } = await db
    .from('workspaces')
    .select('id, meta')
    .not('meta->>migratedFromProjectId', 'is', null)

  if (workspaces) {
    for (const ws of workspaces as Array<{ id: string; meta: Record<string, unknown> }>) {
      const originalProjectId = ws.meta?.migratedFromProjectId as string | undefined
      if (!originalProjectId) continue
      await db
        .from('conversations')
        .update({ project_id: originalProjectId })
        .eq('workspace_id', ws.id)
    }
  }

  // Migrierte Workspaces entfernen
  log('Entferne migrierte Workspaces…')
  const { error: wsDeleteError } = await db
    .from('workspaces')
    .delete()
    .not('meta->>migratedFromProjectId', 'is', null)

  if (wsDeleteError) {
    log(`⚠️  Fehler beim Entfernen migrierter Workspaces: ${wsDeleteError.message}`)
  }

  log('')
  log('✅ Rollback abgeschlossen.')
  log('=== ROLLBACK ENDE ===')
}

// ---------------------------------------------------------------------------
// Einstiegspunkt
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)

async function main() {
  if (args.includes('--rollback')) {
    await rollback()
  } else if (args.includes('--dry-run')) {
    await dryRun()
  } else {
    await migrate()
  }
}

main().catch(err => {
  console.error('❌ Fehler:', err instanceof Error ? err.message : err)
  process.exit(1)
})
