const FRAMEWORKS = [
  {
    id: 'dsgvo',
    label: 'DSGVO',
    tagClass: 'duty-tag--dsgvo',
    score: '8 / 8',
    status: 'Erfüllt',
    ok: true,
    desc: 'Datenschutzerklärung, Datenexport, Account-Löschung — alles vorhanden.',
  },
  {
    id: 'bfsg',
    label: 'BFSG',
    tagClass: 'duty-tag--bfsg',
    score: '7 / 9',
    status: '2 offen',
    ok: false,
    desc: 'Alt-Texte und ARIA-Labels auf Audit-Dashboard fehlen noch.',
  },
  {
    id: 'ai-act',
    label: 'EU AI Act',
    tagClass: 'duty-tag--ai-act',
    score: '12 / 12',
    status: 'Erfüllt',
    ok: true,
    desc: 'KI-Transparenzhinweise und System-Prompt-Statik vorhanden.',
  },
]

export function UseCaseCompliance() {
  return (
    <section style={{ background: 'var(--surface-tint)', padding: 'clamp(64px, 10vw, 120px) 0' }}>
      <div className="section-inner--wide">
        {/* Eyebrow */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
          color: 'var(--accent)', marginBottom: 20, letterSpacing: '0.02em',
        }}>
          <span style={{ width: 28, height: 1, background: 'rgba(63,74,85,0.3)', flexShrink: 0 }} />
          Was wir prüfen — EU-Compliance
        </span>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(40px, 6vw, 80px)',
          alignItems: 'start',
        }}>
          {/* Left */}
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
              EU-Compliance<br />
              <span style={{ color: 'var(--text-tertiary)' }}>integriert.</span>
            </h2>
            <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 28, maxWidth: 420 }}>
              DSGVO. BFSG. EU AI Act.
              Wir prüfen was der DACH-Markt verlangt — du verkaufst sicherer.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['DSGVO Art. 13', 'DSGVO Art. 17', 'DSGVO Art. 20', 'BFSG §12', 'EU AI Act Art. 52', 'WCAG 2.1 AA'].map(tag => (
                <span key={tag} style={{
                  fontSize: 12, fontWeight: 600,
                  fontFamily: 'var(--font-mono, monospace)',
                  padding: '4px 10px',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-secondary)',
                  borderRadius: 4,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Status-Karten */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FRAMEWORKS.map(fw => (
              <div key={fw.id} style={{
                background: 'var(--bg-surface-solid)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className={`duty-tag ${fw.tagClass}`}>{fw.label}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: fw.ok ? 'var(--status-success)' : 'var(--status-danger)',
                    }}>
                      {fw.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {fw.desc}
                  </p>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 13, fontWeight: 700,
                  color: fw.ok ? 'var(--status-success)' : 'var(--status-danger)',
                  flexShrink: 0,
                }}>
                  {fw.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
