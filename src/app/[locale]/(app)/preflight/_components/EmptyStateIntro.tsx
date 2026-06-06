'use client'

export function EmptyStateIntro() {
  const steps = [
    { n: '01', t: 'Konzept rein', d: 'README, PRD oder kurze Beschreibung' },
    { n: '02', t: 'Wir prüfen', d: 'Lücken, Konventionen, Compliance' },
    { n: '03', t: 'Startpaket raus', d: 'Repo-Dateien, copy-ready' },
  ]
  return (
    <div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', marginBottom: 16, letterSpacing: '0.02em' }}>
        <span style={{ width: 28, height: 1, background: 'rgba(45,122,80,0.3)' }} />PRE-FLIGHT
      </span>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, margin: '0 0 10px' }}>
        Dein Repo-Fundament — bevor die erste Zeile entsteht.
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 22px' }}>
        Wir analysieren dein Konzept, schließen die Architektur-Lücken und erzeugen dein Start-Repo mit allen Regeln,
        Konventionen &amp; Sicherheits-Leitplanken. Damit Claude, Cursor &amp; Co. ohne Drift bauen — wartbar, erklärbar, sicher.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
        {steps.map(s => (
          <div key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-tertiary)', minWidth: 24 }}>{s.n}</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{s.t}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{s.d}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
        <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Das bekommst du</p>
        <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          CLAUDE.md / .cursorrules · DECISIONS.md · .env.example · migration.sql
        </p>
      </div>
    </div>
  )
}
