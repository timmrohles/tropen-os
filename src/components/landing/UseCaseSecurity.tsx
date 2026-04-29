export function UseCaseSecurity() {
  return (
    <section style={{ background: 'var(--bg-base)', padding: 'clamp(64px, 10vw, 120px) 0' }}>
      <div className="section-inner--wide">
        {/* Eyebrow */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
          color: 'var(--accent)', marginBottom: 20, letterSpacing: '0.02em',
        }}>
          <span style={{ width: 28, height: 1, background: 'rgba(63,74,85,0.3)', flexShrink: 0 }} />
          Was wir prüfen — Sicherheit
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
              Sicherheit.
            </h2>
            <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32, maxWidth: 420 }}>
              Wir finden Risiken, bevor deine User es tun.
              OWASP Top 10, Auth-Guards, RLS-Coverage, Secret-Scan.
            </p>

            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { n: '01', t: 'Stack-Detection', d: 'Next.js, Auth, DB — wir erkennen was du nutzt.' },
                { n: '02', t: 'Security-Agenten', d: 'OWASP-Regeln, Auth-Checks, Mass Assignment, RLS.' },
                { n: '03', t: 'Secret-Scan', d: 'Potenzielle Keys und Tokens im Code — sofort rotieren.' },
                { n: '04', t: 'Fix-Prompts', d: 'Jedes Finding hat einen kopierfertigen Prompt für Cursor.' },
              ].map(({ n, t, d }) => (
                <li key={n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: 'var(--text-tertiary)', paddingTop: 2, minWidth: 28, flexShrink: 0 }}>{n}</span>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{t}</span>
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 8 }}>{d}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Right: Beispiel-Finding */}
          <div style={{
            background: 'var(--bg-surface-solid)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="duty-tag duty-tag--security">Sicherheits-kritisch</span>
            </div>
            {[
              { rule: 'Auth-Checks fehlen', file: 'src/app/api/projects/route.ts', desc: 'Route hat keinen Auth-Guard. Jeder Request kommt durch.' },
              { rule: 'Potenzielle Secrets im Code', file: 'src/lib/config.ts', desc: 'Möglicher API-Key direkt im Quellcode.' },
            ].map((f, i) => (
              <div key={i} style={{ padding: '14px 18px', borderBottom: i < 1 ? '1px solid var(--border)' : undefined }}>
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
