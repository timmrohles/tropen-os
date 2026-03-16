'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Buildings, Users, Gear } from '@phosphor-icons/react'
import Link from 'next/link'

interface DeptInfo {
  name: string
  memberCount: number
}

export default function DepartmentPage() {
  const [dept, setDept] = useState<DeptInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { window.location.href = '/login'; return }

        const { data: membership } = await supabase
          .from('department_members')
          .select('workspace_id, departments!inner(name)')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (!membership) return

        const deptName = (membership.departments as unknown as { name: string })?.name ?? 'Department'
        const deptId = membership.workspace_id

        const { count } = await supabase
          .from('department_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', deptId)

        setDept({ name: deptName, memberCount: count ?? 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const s: Record<string, React.CSSProperties> = {
    cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
    card: { padding: '20px 22px', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 10 },
    cardTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 },
    cardSub: { fontSize: 12, color: 'var(--text-tertiary)' },
    stat: { fontSize: 28, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' },
  }

  return (
    <div className="content-max" aria-busy={loading}>
        <div className="page-header" style={{ marginBottom: 32 }}>
          <div className="page-header-text">
            <h1 className="page-header-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Buildings size={24} color="var(--accent)" weight="fill" />
              {loading ? 'Department' : (dept?.name ?? 'Department')}
            </h1>
            <p className="page-header-sub">Organisatorische Einheit — Mitglieder und Einstellungen</p>
          </div>
        </div>

        {!loading && dept && (
          <div style={s.cards}>
            <div className="card" style={{ ...s.card, cursor: 'default' }}>
              <div style={s.cardTitle}><Users size={16} weight="fill" color="var(--accent)" /> Mitglieder</div>
              <div style={s.stat}>{dept.memberCount}</div>
              <div style={s.cardSub}>Aktive Mitglieder in diesem Department</div>
            </div>

            <Link href="/admin/users" className="card" style={s.card}>
              <div style={s.cardTitle}><Users size={16} weight="fill" /> User-Verwaltung</div>
              <div style={s.cardSub}>Mitglieder einladen, Rollen verwalten</div>
            </Link>

            <Link href="/admin/budget" className="card" style={s.card}>
              <div style={s.cardTitle}><Gear size={16} weight="fill" /> Budget & Einstellungen</div>
              <div style={s.cardSub}>Budget-Limits und Department-Einstellungen</div>
            </Link>
          </div>
        )}
    </div>
  )
}

