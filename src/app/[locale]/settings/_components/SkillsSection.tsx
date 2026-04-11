'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowSquareOut } from '@phosphor-icons/react'

interface Skill {
  id: string
  name: string
  description: string | null
  scope: string
}

export function SkillsSection() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = (async () => {
      const { createClient } = await import('@/utils/supabase/client')
      return createClient()
    })()

    client.then(async supabase => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('skills')
        .select('id, name, description, scope')
        .or(`scope.eq.system,scope.eq.org`)
        .order('name')
      setSkills(data ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="card">
      <div className="card-body" style={{ padding: '16px 18px' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Lade…</p>
      </div>
    </div>
  )

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-header-label">Meine Skills</span>
        <Link href="/agenten" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <ArrowSquareOut size={12} weight="bold" aria-hidden="true" />
          Skills verwalten
        </Link>
      </div>
      <div className="card-body" style={{ padding: '12px 18px' }}>
        {skills.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Noch keine Skills verfügbar.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {skills.map(skill => (
              <div key={skill.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{skill.name}</div>
                  {skill.description && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{skill.description}</div>
                  )}
                </div>
                <span style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'var(--bg-base)',
                  color: 'var(--text-tertiary)',
                  alignSelf: 'flex-start',
                  flexShrink: 0,
                }}>
                  {skill.scope}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
