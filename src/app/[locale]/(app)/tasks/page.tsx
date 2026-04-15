import { redirect } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/utils/supabase/server'
import { fetchUserOrgId, fetchTasksAndProjects } from '@/lib/audit/tasks-data'
import { TasksClient } from './_components/TasksClient'

export default async function TasksPage() {
  const locale = await getLocale()
  const t = await getTranslations('tasks')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const orgId = await fetchUserOrgId(user.id)
  if (!orgId) redirect(`/${locale}/login`)

  const { tasks, scanProjects } = await fetchTasksAndProjects(orgId)

  return (
    <TasksClient
      initialTasks={tasks}
      scanProjects={scanProjects}
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
