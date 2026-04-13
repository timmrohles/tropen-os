import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { TasksClient } from './_components/TasksClient'

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

export default async function TasksPage() {
  const t = await getTranslations('tasks')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) redirect('/login')

  const [{ data: tasks }, { data: scanProjects }] = await Promise.all([
    supabaseAdmin
      .from('audit_tasks')
      .select('id, finding_id, audit_run_id, scan_project_id, title, agent_source, rule_id, severity, file_path, description, suggestion, completed, completed_at, dismissed_at, created_at')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('scan_projects')
      .select('id, name')
      .eq('org_id', profile.organization_id),
  ])

  return (
    <TasksClient
      initialTasks={(tasks ?? []) as AuditTask[]}
      scanProjects={(scanProjects ?? []) as ScanProject[]}
      strings={{
        title: t('title'),
        subtitle: t('subtitle', { open: 0, completed: 0, dismissed: 0 }),
        exportMarkdown: t('exportMarkdown'),
        exportPrompt: t('exportPrompt'),
        filterStatus: t('filterStatus'),
        filterProject: t('filterProject'),
        filterSeverity: t('filterSeverity'),
        statusAll: t('statusAll'),
        statusOpen: t('statusOpen'),
        statusCompleted: t('statusCompleted'),
        statusDismissed: t('statusDismissed'),
        severityAll: t('severityAll'),
        projectAll: t('projectAll'),
        projectInternal: t('projectInternal'),
        noTasks: t('noTasks'),
        noTasksHint: t('noTasksHint'),
        noTasksFiltered: t('noTasksFiltered'),
        completedLabel: t('completedLabel'),
        dismissedLabel: t('dismissedLabel'),
        copyPrompt: t('copyPrompt'),
        dismiss: t('dismiss'),
        undoDismiss: t('undoDismiss'),
        markComplete: t('markComplete'),
        markOpen: t('markOpen'),
        deleteTask: t('deleteTask'),
        bulkComplete: t('bulkComplete'),
        bulkCopyPrompt: t('bulkCopyPrompt'),
        bulkDismiss: t('bulkDismiss'),
        bulkDelete: t('bulkDelete'),
        selectedCount: t('selectedCount', { count: 0 }),
        copied: t('copied'),
        promptHeader: t('promptHeader'),
        noFilePath: t('noFilePath'),
        createdAt: t('createdAt'),
        severity_critical: t('severity_critical'),
        severity_high: t('severity_high'),
        severity_medium: t('severity_medium'),
        severity_low: t('severity_low'),
        severity_info: t('severity_info'),
      }}
    />
  )
}
