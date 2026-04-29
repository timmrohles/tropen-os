export function UseCasePerformance() {
  return (
    <section style={{ background: 'var(--surface-warm)', padding: 'clamp(64px, 10vw, 120px) 0' }}>
      <div className="section-inner--wide">
        {/* Eyebrow */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
          color: 'var(--accent)', marginBottom: 20, letterSpacing: '0.02em',
        }}>
          <span style={{ width: 28, height: 1, background: 'rgba(63,74,85,0.3)', flexShrink: 0 }} />
          Was wir prüfen — Performance
        </span>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(40px, 6vw, 80px)',
          alignItems: 'start',
        }}>
          {/* Left: Erklärung */}
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
              fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              marginBottom: 20,
            }}>
              Performance.
            </h2>
            <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32, maxWidth: 420 }}>
              Vom Lighthouse-Score zur tatsächlichen Ladezeit.
              Bundle-Analyse, Render-Performance, Database-Queries.
            </p>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { metric: 'LCP', val: '2.1s', label: 'Largest Contentful Paint' },
                { metric: 'TTI', val: '3.4s', label: 'Time to Interactive' },
                { metric: 'Score', val: '84', label: 'Lighthouse' },
              ].map(({ metric, val, label }) => (
                <div key={metric} style={{
                  background: 'var(--bg-surface-solid)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '14px 20px',
                  flex: '1 1 120px',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 22, fontWeight: 700, color: 'var(--secondary)', lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Findings */}
          <div style={{
            background: 'var(--bg-surface-solid)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Performance-Findings
            </div>
            {[
              { rule: 'Bundle zu groß', file: 'next.config.ts', desc: '@sentry/nextjs lädt auf jeder Seite — 124kB gz über Budget.' },
              { rule: 'Unnötige Re-Renders', file: 'src/components/workspace/ChatArea.tsx', desc: 'Zu viele useState-Calls ohne Memoization.' },
              { rule: 'Fetch in useEffect', file: 'src/components/audit/FindingsTable.tsx', desc: 'Daten-Fetch ohne Cache — bei jedem Render neu.' },
            ].map((f, i) => (
              <div key={i} style={{ padding: '14px 18px', borderBottom: i < 2 ? '1px solid var(--border)' : undefined }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{f.rule}</div>
                <code style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)', display: 'block', marginBottom: 4 }}>{f.file}</code>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
