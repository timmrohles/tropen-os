import { Link } from '@/i18n/navigation'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'

function ExampleFindingCard() {
  return (
    <div style={{
      background: 'var(--bg-surface-solid)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 24,
      boxShadow: '0 4px 24px rgba(26,23,20,0.06)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span className="duty-tag duty-tag--security">High Severity</span>
        <code style={{
          fontSize: 11, color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono, monospace)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          supabase/functions/ai-chat/index.ts
        </code>
      </div>

      {/* Finding */}
      <h3 style={{
        fontSize: 16, fontWeight: 600, color: 'var(--text-primary)',
        marginBottom: 8, lineHeight: 1.3,
      }}>
        Datei zu lang — 924 Zeilen
      </h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
        ai-chat/index.ts ist mit 924 Zeilen ziemlich groß geworden.
        Das wird beim nächsten Refactor schwierig.
      </p>

      {/* Fix-Prompt */}
      <div style={{
        background: 'var(--surface-tint)',
        borderRadius: 8,
        padding: '14px 16px',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Fix-Prompt für Cursor
          </span>
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
            📋 Kopieren
          </span>
        </div>
        <pre style={{
          margin: 0,
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 11,
          lineHeight: 1.7,
          color: 'var(--text-secondary)',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
        }}>
{`Refactor ai-chat/index.ts in drei Module:
- ai-chat/router.ts (Modell-Auswahl)
- ai-chat/streaming.ts (Stream-Handling)
- ai-chat/index.ts (Public API)

Streaming-Verhalten erhalten, alle Tests grün.`}
        </pre>
      </div>
    </div>
  )
}

export function HeroSection({ locale: _locale }: { locale: string }) {
  return (
    <section style={{
      background: 'var(--gradient-hero)',
      paddingTop: 'clamp(96px, 14vw, 160px)',
      paddingBottom: 'clamp(64px, 10vw, 120px)',
    }}>
      <div className="section-inner--wide">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'clamp(48px, 8vw, 96px)',
          alignItems: 'center',
        }}>
          {/* Left: Marketing */}
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
              fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: 'var(--text-primary)',
              marginBottom: 24,
            }}>
              Dein Code,<br />
              <span style={{ color: 'var(--accent)' }}>in Production-Reife.</span>
            </h1>

            <p style={{
              fontSize: 'clamp(16px, 2vw, 19px)',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              maxWidth: 480,
              marginBottom: 32,
            }}>
              183 Regeln. 25 Kategorien. Score in 60 Sekunden.
              Fix-Prompts direkt für Cursor oder Claude Code.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link
                href="/login"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '13px 26px', fontSize: 15, fontWeight: 600 }}
              >
                Audit starten
                <ArrowRight size={15} weight="bold" aria-hidden="true" />
              </Link>
              <Link
                href="/audit/scan"
                className="btn btn-ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', padding: '13px 22px', fontSize: 15 }}
              >
                Repo verbinden
              </Link>
            </div>

            {/* Trust numbers */}
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              {[
                { n: '183', label: 'Regeln' },
                { n: '25', label: 'Kategorien' },
                { n: '60s', label: 'pro Audit' },
              ].map(({ n, label }) => (
                <div key={label} className="data-highlight">
                  <span className="data-highlight__number">{n}</span>
                  <span className="data-highlight__label">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Example finding */}
          <div>
            <ExampleFindingCard />
          </div>
        </div>
      </div>
    </section>
  )
}
