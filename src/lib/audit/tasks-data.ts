import { supabaseAdmin } from '@/lib/supabase-admin'

export interface AuditTask {
  id: string
  finding_id: string | null
  audit_run_id: string | null
  scan_project_id: string | null
  title: string
  agent_source: string | null
  rule_id: string | null
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info' | null
  file_path: string | null
  description: string | null
  suggestion: string | null
  completed: boolean
  completed_at: string | null
  dismissed_at: string | null
  created_at: string
}

export interface ScanProject {
  id: string
  name: string
}

export async function fetchUserOrgId(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single()
  return data?.organization_id ?? null
}

export async function fetchTasksAndProjects(orgId: string): Promise<{
  tasks: AuditTask[]
  scanProjects: ScanProject[]
}> {
  const [{ data: tasks }, { data: scanProjects }] = await Promise.all([
    supabaseAdmin
      .from('audit_tasks')
      .select('id, finding_id, audit_run_id, scan_project_id, title, agent_source, rule_id, severity, file_path, description, suggestion, completed, completed_at, dismissed_at, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('scan_projects')
      .select('id, name')
      .eq('org_id', orgId),
  ])

  return {
    tasks: (tasks ?? []) as AuditTask[],
    scanProjects: (scanProjects ?? []) as ScanProject[],
  }
}
