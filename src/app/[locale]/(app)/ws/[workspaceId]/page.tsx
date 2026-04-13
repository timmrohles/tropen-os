import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

export default async function WorkspaceIndexPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const locale = await getLocale()
  const { workspaceId } = await params
  redirect(`/${locale}/ws/${workspaceId}/canvas`)
}
