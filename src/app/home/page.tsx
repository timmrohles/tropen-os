import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import AnnouncementsFeed from '@/components/home/AnnouncementsFeed'
import ChatCTA from '@/components/home/ChatCTA'
import FeatureGrid from '@/components/home/FeatureGrid'
import RecentlyUsed from '@/components/home/RecentlyUsed'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Guten Morgen'
  if (hour < 18) return 'Guten Tag'
  return 'Guten Abend'
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('full_name, organization_id')
    .eq('id', user.id)
    .maybeSingle()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Team'
  const orgId = profile?.organization_id ?? null
  const now = new Date().toISOString()

  const { data: tropenAnn } = await supabaseAdmin
    .from('announcements')
    .select('id, title, body, url, url_label, type, source, published_at')
    .is('organization_id', null)
    .eq('source', 'tropen')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('published_at', { ascending: false })
    .limit(3)

  let orgAnn: typeof tropenAnn = []
  if (orgId) {
    const { data } = await supabaseAdmin
      .from('announcements')
      .select('id, title, body, url, url_label, type, source, published_at')
      .eq('organization_id', orgId)
      .eq('source', 'org')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('published_at', { ascending: false })
      .limit(3)
    orgAnn = data ?? []
  }
  const announcements = [...(tropenAnn ?? []), ...(orgAnn)].slice(0, 5)

  const { data: recentChats } = await supabaseAdmin
    .from('conversations')
    .select('id, title, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(3)

  let recentWorkspaces: { id: string; title: string; updated_at: string }[] = []
  if (orgId) {
    const { data } = await supabaseAdmin
      .from('workspaces')
      .select('id, title, updated_at')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(2)
    recentWorkspaces = (data ?? []) as { id: string; title: string; updated_at: string }[]
  }

  let orgName = 'Org'
  if (orgId) {
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .maybeSingle()
    orgName = org?.name ?? 'Org'
  }

  return (
    <div className="content-max">

      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: 'var(--text-primary)',
          letterSpacing: '-0.03em', margin: 0,
        }}>
          {getGreeting()}, {firstName} 👋
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Was möchtest du heute angehen?
        </p>
      </div>

      {announcements.length > 0 && (
        <AnnouncementsFeed announcements={announcements} orgName={orgName} />
      )}

      <ChatCTA />
      <FeatureGrid />

      {((recentChats && recentChats.length > 0) || recentWorkspaces.length > 0) && (
        <RecentlyUsed
          chats={recentChats ?? []}
          workspaces={recentWorkspaces}
        />
      )}

    </div>
  )
}
