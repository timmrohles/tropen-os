'use server'
// src/actions/feed-topics.ts — Themen-System (Topics)
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthUser } from '@/lib/api/projects'
import type { FeedTopic } from '@/types/feeds'

export async function listTopics(): Promise<FeedTopic[]> {
  const me = await getAuthUser()
  if (!me) return []
  const { data } = await supabaseAdmin
    .from('feed_topics')
    .select('*, feed_topic_sources(source_id)')
    .eq('user_id', me.id)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  return (data ?? []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    userId: t.user_id as string,
    organizationId: t.organization_id as string,
    name: t.name as string,
    color: (t.color as string) ?? null,
    displayOrder: t.display_order as number,
    sourceIds: ((t.feed_topic_sources as Array<{ source_id: string }>) ?? []).map((s) => s.source_id),
    createdAt: t.created_at as string,
    updatedAt: t.updated_at as string,
  }))
}

export async function createTopic(name: string, sourceIds: string[] = []): Promise<{ topic?: FeedTopic; error?: string }> {
  const me = await getAuthUser()
  if (!me) return { error: 'Nicht autorisiert' }
  const trimmed = name.trim().slice(0, 100)
  if (!trimmed) return { error: 'Name ist erforderlich' }

  const { data, error } = await supabaseAdmin
    .from('feed_topics')
    .insert({ user_id: me.id, organization_id: me.organization_id, name: trimmed })
    .select().single()
  if (error) return { error: error.message }

  const raw = data as Record<string, unknown>
  const topic: FeedTopic = {
    id: raw.id as string,
    userId: me.id,
    organizationId: me.organization_id,
    name: trimmed,
    color: null,
    displayOrder: 0,
    sourceIds: [],
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  }

  if (sourceIds.length > 0) {
    await supabaseAdmin.from('feed_topic_sources')
      .insert(sourceIds.map((sid) => ({ topic_id: topic.id, source_id: sid })))
    topic.sourceIds = sourceIds
  }
  return { topic }
}

export async function deleteTopic(id: string): Promise<{ error?: string }> {
  const me = await getAuthUser()
  if (!me) return { error: 'Nicht autorisiert' }
  const { error } = await supabaseAdmin
    .from('feed_topics').delete()
    .eq('id', id).eq('user_id', me.id)
  return { error: error?.message }
}

export async function toggleTopicSource(
  topicId: string,
  sourceId: string,
  add: boolean,
): Promise<{ error?: string }> {
  const me = await getAuthUser()
  if (!me) return { error: 'Nicht autorisiert' }

  // Ownership check
  const { data: topic } = await supabaseAdmin
    .from('feed_topics').select('id').eq('id', topicId).eq('user_id', me.id).maybeSingle()
  if (!topic) return { error: 'Thema nicht gefunden' }

  if (add) {
    await supabaseAdmin.from('feed_topic_sources')
      .upsert({ topic_id: topicId, source_id: sourceId })
  } else {
    await supabaseAdmin.from('feed_topic_sources')
      .delete().eq('topic_id', topicId).eq('source_id', sourceId)
  }
  return {}
}
