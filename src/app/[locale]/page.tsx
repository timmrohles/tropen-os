import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { ArrowRight, Check } from '@phosphor-icons/react/dist/ssr'
import HowItWorksClient from './_lp/HowItWorksClient'

export const metadata = {
  title: 'Tropen OS — Production Readiness Guide für Vibe-Coders',
  description: '60 Sekunden. 25 Kategorien. Ein Score. Wir prüfen was Cursor, Lovable und Bolt nicht prüfen — DSGVO, Security, Barrierefreiheit.',
}

// ── Shared max-width container ─────────────────────────────────────────────────
function C({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(20px, 5vw, 56px)', ...style }}>
      {children}
    </div>
  )
}

// ── Section eyebrow label (Optimus pattern: — Label) ──────────────────────────
function Tag({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  const color = dark ? 'rgba(77,184,122,0.85)' : 'var(--accent)'
  const line  = dark ? 'rgba(77,184,122,0.3)' : 'rgba(45,122,80,0.3)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color, marginBottom: 20, letterSpacing: '0.02em' }}>
      <span style={{ width: 28, height: 1, background: line, flexShrink: 0 }} />
      {children}
    </span>
  )
}

const STATS = [
  { value: '94%', text: 'der Vibe-Apps verstoßen gegen DSGVO' },
  { value: '+23%', text: 'Ø Score-Verbesserung nach erstem Fix' },
  { value: '195', text: 'Regeln in 25 Kategorien' },
  { value: '€20.000', text: 'durchschn. DSGVO-Bußgeld' },
]

const CATEGORIES = [
  'Security', 'DSGVO', 'BFSG', 'AI Act', 'Code-Qualität', 'Architektur',
  'Performance', 'Testing', 'API-Design', 'Datenbank', 'Observability', 'CI/CD',
  'Dependencies', 'Error Handling', 'State Management', 'Design System',
  'Accessibility', 'Git Governance', 'Cost Awareness', 'Dokumentation',
  'Infrastructure', 'Supply Chain', 'Namenskonventionen', 'Skalierbarkeit', 'PWA',
]

const TOOLS = [
  { name: 'Cursor',      src: 'https://cdn.simpleicons.org/cursor/4A4540' },
  { name: 'Lovable',     src: 'https://www.google.com/s2/favicons?domain=lovable.dev&sz=128' },
  { name: 'Bolt',        src: 'https://cdn.simpleicons.org/stackblitz/4A4540' },
  { name: 'Claude Code', src: 'https://cdn.simpleicons.org/anthropic/4A4540' },
  { name: 'v0',          src: 'https://cdn.simpleicons.org/vercel/4A4540' },
  { name: 'Replit',      src: 'https://cdn.simpleicons.org/replit/4A4540' },
  { name: 'Windsurf',    src: 'https://cdn.simpleicons.org/windsurf/4A4540' },
  { name: 'Next.js',     src: 'https://cdn.simpleicons.org/nextdotjs/4A4540' },
  { name: 'React',       src: 'https://cdn.simpleicons.org/react/4A4540' },
  { name: 'Supabase',    src: 'https://cdn.simpleicons.org/supabase/4A4540' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <>
      <style>{`
        /* Ticker */
        @keyframes lp-ticker { to { transform: translateX(-50%); } }
        @keyframes lp-progress { to { width: 100%; } }
        @media (prefers-reduced-motion: reduce) {
          .lp-ticker-inner { animation: none !important; }
        }
        .lp-ticker-wrap { overflow: hidden; }
        .lp-ticker-inner {
          display: flex; width: max-content;
          animation: lp-ticker 28s linear infinite;
        }
        .lp-ticker-wrap:hover .lp-ticker-inner { animation-play-state: paused; }

        /* Nav hover underline */
        .lp-nav-link { position: relative; }
        .lp-nav-link::after {
          content: '';
          position: absolute; bottom: -2px; left: 0;
          width: 0; height: 1px;
          background: #ffffff;
          transition: width 280ms;
        }
        .lp-nav-link:hover::after { width: 100%; }

        /* Feature row hover */
        .lp-feat-row { transition: opacity 300ms; }
        .lp-feat-row:hover .lp-feat-title { transform: translateX(4px); }
        .lp-feat-title { transition: transform 400ms; }

        /* Compliance card hover */
        .lp-comp-card {
          border: 1px solid rgba(26,23,20,0.08);
          transition: border-color 200ms;
        }
        .lp-comp-card:hover { border-color: var(--accent); }

        /* Tool hover */
        .lp-tool {
          display: flex; align-items: center; gap: 9px;
          font-family: var(--font-mono, "JetBrains Mono", monospace);
          font-size: 14px;
          color: var(--text-tertiary);
          transition: color 150ms;
        }
        .lp-tool:hover { color: var(--text-primary); }
        .lp-tool img { opacity: 0.55; filter: grayscale(1); transition: opacity 150ms; }
        .lp-tool:hover img { opacity: 1; }

        /* Pricing grid gap-px trick */
        .lp-pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1px;
          background: rgba(26,23,20,0.08);
        }
        .lp-pricing-cell {
          background: var(--bg-surface-solid, #ffffff);
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
        }
        .lp-pricing-cell-pop {
          border: 2px solid var(--text-primary);
          margin: -1px;
          position: relative;
          z-index: 1;
        }

        /* CTA box */
        .lp-cta-box {
          border: 1px solid var(--text-primary);
          position: relative;
        }
        .lp-cta-box::before {
          content: '';
          position: absolute; top: 0; right: 0;
          width: 96px; height: 96px;
          border-bottom: 1px solid rgba(26,23,20,0.12);
          border-left: 1px solid rgba(26,23,20,0.12);
        }
        .lp-cta-box::after {
          content: '';
          position: absolute; bottom: 0; left: 0;
          width: 96px; height: 96px;
          border-top: 1px solid rgba(26,23,20,0.12);
          border-right: 1px solid rgba(26,23,20,0.12);
        }

        /* Footer links */
        .lp-footer-link {
          display: block;
          font-size: 13px;
          color: var(--text-secondary);
          text-decoration: none;
          margin-bottom: 12px;
          transition: color 140ms;
        }
        .lp-footer-link:hover { color: var(--text-primary); }

        /* Screen-reader only */
        .lp-sr {
          position: absolute; width: 1px; height: 1px;
          overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap;
        }

        /* Compliance card — dark variant */
        .lp-comp-card-dark {
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          transition: border-color 200ms;
        }
        .lp-comp-card-dark:hover { border-color: rgba(255,255,255,0.28); }

        /* Accent CTA — filled green, hover brightens */
        .lp-cta-accent {
          background: var(--accent) !important;
          color: #ffffff !important;
          transition: filter 150ms;
        }
        .lp-cta-accent:hover { filter: brightness(1.15); }

        /* White CTA — for dark section backgrounds */
        .lp-cta-white {
          background: #ffffff;
          color: var(--active-bg) !important;
          transition: filter 150ms;
        }
        .lp-cta-white:hover { filter: brightness(0.93); }

        /* Dark CTA box — corners for dark section */
        .lp-cta-box-dark {
          border: 1px solid rgba(255,255,255,0.2);
          position: relative;
        }
        .lp-cta-box-dark::before {
          content: '';
          position: absolute; top: 0; right: 0;
          width: 96px; height: 96px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          border-left: 1px solid rgba(255,255,255,0.1);
        }
        .lp-cta-box-dark::after {
          content: '';
          position: absolute; bottom: 0; left: 0;
          width: 96px; height: 96px;
          border-top: 1px solid rgba(255,255,255,0.1);
          border-right: 1px solid rgba(255,255,255,0.1);
        }

        /* Ghost on dark */
        .lp-ghost-dark {
          border: 1px solid rgba(255,255,255,0.28) !important;
          color: #ffffff !important;
          background: transparent !important;
        }
        .lp-ghost-dark:hover { background: rgba(255,255,255,0.07) !important; }
      `}</style>

      <div style={{ minHeight: '100vh', fontFamily: 'var(--font-sans, Inter, sans-serif)', color: 'var(--text-primary)' }}>

        {/* ═══════════════════════════════════════════════════════════════
            NAV
        ═══════════════════════════════════════════════════════════════ */}
        <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(26,46,35,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <C style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.025em', color: '#ffffff' }}>
                Tropen OS
              </span>
            </a>
            <nav aria-label="Primäre Navigation" style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
              {[
                { label: 'Kategorien', href: '#kategorien' },
                { label: 'Pricing', href: '#pricing' },
              ].map(l => (
                <a key={l.label} href={l.href} className="lp-nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>{l.label}</a>
              ))}
              <Link href="/login" className="btn btn-primary" style={{ fontSize: 13, padding: '7px 18px', textDecoration: 'none' }}>
                Anmelden
              </Link>
            </nav>
          </C>
        </header>

        {/* ═══════════════════════════════════════════════════════════════
            HERO — dark
        ═══════════════════════════════════════════════════════════════ */}
        <section style={{ background: 'var(--active-bg)', paddingTop: 'clamp(120px, 16vw, 160px)', paddingBottom: 0, position: 'relative', overflow: 'hidden' }}>
          {/* Subtle grid lines */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04 }}>
            {[1,2,3,4,5,6,7].map(i => (
              <div key={`h${i}`} style={{ position: 'absolute', height: 1, background: '#ffffff', top: `${i * 14.3}%`, left: 0, right: 0 }} />
            ))}
            {[1,2,3,4,5,6,7,8,9,10,11].map(i => (
              <div key={`v${i}`} style={{ position: 'absolute', width: 1, background: '#ffffff', left: `${i * 9.1}%`, top: 0, bottom: 0 }} />
            ))}
          </div>

          <C style={{ position: 'relative', zIndex: 1, paddingBottom: 'clamp(64px, 8vw, 96px)' }}>
            {/* Eyebrow */}
            <div style={{ marginBottom: 28 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                <span style={{ width: 28, height: 1, background: 'rgba(255,255,255,0.25)' }} />
                Production Readiness Guide
              </span>
            </div>

            {/* Headline — Optimus style: large, tracking-tight, leading-[0.9] */}
            <h1 style={{
              fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
              fontSize: 'clamp(2.8rem, 8.5vw, 7rem)',
              fontWeight: 800, lineHeight: 0.92, letterSpacing: '-0.04em',
              color: '#ffffff', marginBottom: 48,
            }}>
              <span style={{ display: 'block' }}>Ist deine App</span>
              <span style={{ display: 'block' }}>ready für</span>
              <span style={{ display: 'block', color: 'rgba(255,255,255,0.35)' }}>echte User?</span>
            </h1>

            {/* Optimus pattern: 2-col grid — description left, CTAs right */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px 80px', alignItems: 'end' }}>
              <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 480 }}>
                60 Sekunden. 25 Kategorien. Ein Score.<br />
                Wir prüfen was Cursor, Lovable und Bolt nicht prüfen —<br />
                DSGVO, Security, Barrierefreiheit.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <Link href="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '13px 26px', fontSize: 15, fontWeight: 600 }}>
                  Kostenlos scannen
                  <ArrowRight size={15} weight="bold" aria-hidden="true" style={{ transition: 'transform 200ms' }} />
                </Link>
                <Link href="#" className="btn btn-ghost lp-ghost-dark" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', padding: '13px 22px', fontSize: 15 }}>
                  Demo ansehen
                </Link>
              </div>
            </div>
          </C>

          {/* Stats marquee pinned at bottom of hero */}
          <div className="lp-ticker-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '18px 0' }} aria-hidden="true">
            <div className="lp-ticker-inner">
              {[...STATS, ...STATS].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', paddingRight: 64 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', marginRight: 20, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{s.value}</span>
                    {' '}
                    <span style={{ color: 'rgba(255,255,255,0.45)' }}>{s.text}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="lp-sr">{STATS.map(s => `${s.value} ${s.text}`).join(' · ')}</p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            CAPABILITIES 01–04 — light (Optimus: FeaturesSection)
        ═══════════════════════════════════════════════════════════════ */}
        <section id="features" style={{ background: 'var(--bg-base, #EAE9E5)', padding: 'clamp(72px, 10vw, 96px) 0' }}>
          <C>
            <div style={{ marginBottom: 'clamp(48px, 6vw, 64px)' }}>
              <Tag>Was wir finden</Tag>
              <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.05 }}>
                Die Probleme die dein<br />
                <span style={{ color: 'var(--text-tertiary)' }}>Coding-Tool übersieht.</span>
              </h2>
            </div>

            {[
              { n: '01', title: 'DSGVO & Legal', text: 'Impressum fehlt, Cookies ohne Consent, personenbezogene Daten falsch gespeichert. Das sind keine Kleinigkeiten — das sind Bußgelder.' },
              { n: '02', title: 'Security & Auth', text: 'API-Routes ohne Validierung, Secrets im Code, fehlende Rate-Limits. Ein schlechter Tag kann deine gesamte User-Datenbank leaken.' },
              { n: '03', title: 'Barrierefreiheit', text: 'Fehlende Alt-Texte, kein Keyboard-Support, Kontraste unter dem Minimum. Seit Juni 2025 ist Barrierefreiheit in der EU Pflicht (BFSG).' },
              { n: '04', title: 'Code-Qualität & Architektur', text: 'Dateien über 500 Zeilen, Business-Logik in UI-Komponenten, keine Error-Boundaries. Code der funktioniert ist nicht Code der wartbar ist.' },
            ].map(f => (
              <div key={f.n} className="lp-feat-row" style={{ display: 'flex', gap: 'clamp(24px, 4vw, 64px)', padding: 'clamp(28px, 4vw, 40px) 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                {/* Number */}
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'var(--text-tertiary)', paddingTop: 6, flexShrink: 0, width: 28 }}>{f.n}</span>
                {/* Content */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, alignItems: 'center' }}>
                  <h3 className="lp-feat-title" style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(20px, 2.5vw, 30px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.text}</p>
                </div>
              </div>
            ))}
          </C>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            HOW IT WORKS — light (merged into big light block)
        ═══════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" style={{ background: 'var(--active-bg)', padding: 'clamp(72px, 10vw, 96px) 0' }}>
          <C>
            <div style={{ marginBottom: 'clamp(48px, 6vw, 72px)' }}>
              <Tag dark>So funktioniert&apos;s</Tag>
              <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', lineHeight: 1.05 }}>
                Drei Schritte.<br />
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Kein Setup.</span>
              </h2>
            </div>

            <HowItWorksClient />
          </C>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            CATEGORIES — light
        ═══════════════════════════════════════════════════════════════ */}
        <section id="kategorien" style={{ background: 'var(--bg-base, #EAE9E5)', padding: 'clamp(72px, 10vw, 96px) 0' }}>
          <C>
            <div style={{ maxWidth: 720, marginBottom: 48 }}>
              <Tag>Vollständige Abdeckung</Tag>
              <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.05 }}>
                25 Kategorien.<br />
                <span style={{ color: 'var(--text-tertiary)' }}>Kein Punkt wird übersprungen.</span>
              </h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(cat => (
                <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', fontSize: 15, padding: '6px 14px', borderRadius: 4, border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>
                  {cat}
                </span>
              ))}
            </div>
          </C>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            COMPLIANCE — dark
        ═══════════════════════════════════════════════════════════════ */}
        <section id="compliance" style={{ background: 'var(--active-bg)', padding: 'clamp(72px, 10vw, 96px) 0' }}>
          <C>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(40px, 6vw, 80px)', alignItems: 'start' }}>
              {/* Left */}
              <div>
                <Tag dark>EU-Compliance</Tag>
                <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', lineHeight: 1.05, marginBottom: 20 }}>
                  Compliance ist<br />Schutz, nicht<br />Bürokratie.
                </h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 28, maxWidth: 380 }}>
                  Europäische Regulierung schützt echte Menschen. Wir übersetzen sie in konkrete Code-Checks.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['DSGVO', 'BFSG', 'AI Act', 'WCAG 2.1 AA'].map(b => (
                    <span key={b} style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', padding: '6px 14px', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.02em' }}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              {/* Right — feature cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { title: 'DSGVO', text: 'Datenschutzerklärung, Consent, Datenexport, Löschrecht — auf Code-Architektur-Ebene geprüft.' },
                  { title: 'BFSG', text: 'Seit Juni 2025 Pflicht für B2C-Apps in der EU. Barrierefreiheit ist kein Nice-to-have mehr.' },
                  { title: 'AI Act', text: 'Transparenzpflicht, Risiko-Klassifizierung. Das erste Tool das AI Act auf Code-Ebene prüft.' },
                ].map(item => (
                  <div key={item.title} className="lp-comp-card-dark" style={{ padding: '20px 22px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>{item.title}</h3>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </C>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            TOOL-AGNOSTIC — light (Optimus: IntegrationsSection)
        ═══════════════════════════════════════════════════════════════ */}
        <section style={{ background: 'var(--bg-base, #EAE9E5)', padding: 'clamp(72px, 10vw, 96px) 0' }}>
          <C style={{ textAlign: 'center' }}>
            <Tag>Egal womit du gebaut hast</Tag>
            <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.05, marginBottom: 12 }}>
              Funktioniert mit jedem Stack.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-tertiary)', marginBottom: 44 }}>Kein Lock-in. Kein Framework-Zwang.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 28px', justifyContent: 'center', alignItems: 'center' }}>
              {TOOLS.map(({ name, src }) => (
                // eslint-disable-next-line @next/next/no-img-element
                <span key={name} className="lp-tool">
                  <img src={src} width={22} height={22} alt="" aria-hidden="true" />
                  {name}
                </span>
              ))}
            </div>
          </C>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            PRICING — light bg, white cards (Optimus: PricingSection)
        ═══════════════════════════════════════════════════════════════ */}
        <section id="pricing" style={{ background: 'var(--bg-base, #EAE9E5)', padding: 'clamp(72px, 10vw, 96px) 0' }}>
          <C>
            <div style={{ maxWidth: 640, marginBottom: 52 }}>
              <Tag>Pricing</Tag>
              <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 0.95, marginBottom: 16 }}>
                Einfache Preise.<br />
                <span style={{ color: 'var(--text-tertiary)' }}>Keine Überraschungen.</span>
              </h2>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Start free und scale wenn du bereit bist.</p>
            </div>

            {/* Billing toggle — static UI */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
              <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>Monatlich</span>
              <div style={{ width: 48, height: 26, background: 'rgba(26,23,20,0.08)', borderRadius: 13, padding: 3, position: 'relative' }}>
                <div style={{ width: 20, height: 20, background: 'var(--accent)', borderRadius: '50%' }} />
              </div>
              <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>
                Jährlich{' '}
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', background: 'var(--accent)', color: '#ffffff', padding: '2px 6px', marginLeft: 6 }}>−17%</span>
              </span>
            </div>

            {/* Cards — gap-px grid like Optimus */}
            <div className="lp-pricing-grid">
              {/* 01 Free */}
              <div className="lp-pricing-cell">
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: 'var(--text-tertiary)' }}>01</span>
                <h3 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, marginBottom: 4 }}>Free</h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Für Hobby-Projekte</p>
                <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 52, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>€0</span>
                    <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>/Monat</span>
                  </div>
                </div>
                <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['1 Projekt', '10 Scans / Monat', 'Top 5 Findings', 'Score-Tracking', '.cursorrules Export'].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: 'var(--text-secondary)' }}>
                      <Check size={14} weight="bold" color="var(--text-primary)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 0', border: '1px solid rgba(26,23,20,0.2)', fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none', transition: 'border-color 200ms', fontWeight: 500 }}>
                  Kostenlos starten
                  <ArrowRight size={14} weight="bold" aria-hidden="true" />
                </Link>
              </div>

              {/* 02 Pro — Most Popular, elevated */}
              <div className="lp-pricing-cell lp-pricing-cell-pop">
                <span style={{ position: 'absolute', top: -11, left: 24, background: '#E5A000', color: '#ffffff', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', padding: '3px 12px', letterSpacing: '0.07em' }}>
                  Most Popular
                </span>
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: 'var(--accent)' }}>02</span>
                <h3 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, marginBottom: 4 }}>Pro</h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Für Gründer die launchen wollen</p>
                <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 52, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>€39</span>
                    <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>/Monat</span>
                  </div>
                </div>
                <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['3 Projekte', 'Unbegrenzte Scans', 'Deep Review (4 KI-Modelle)', 'EU-Compliance (DSGVO, BFSG, AI Act)', 'Prompt-Export', 'Aufgabenliste', 'Score-Verlauf'].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: 'var(--text-secondary)' }}>
                      <Check size={14} weight="bold" color="var(--text-primary)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="lp-cta-accent" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 0', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
                  14 Tage kostenlos
                  <ArrowRight size={14} weight="bold" aria-hidden="true" />
                </Link>
              </div>

              {/* 03 Agency */}
              <div className="lp-pricing-cell">
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, color: 'var(--text-tertiary)' }}>03</span>
                <h3 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, marginBottom: 4 }}>Agency</h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>Für Teams und Freelancer</p>
                <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>€199</span>
                  <span style={{ fontSize: 14, color: 'var(--text-tertiary)', marginLeft: 4 }}>/Monat</span>
                </div>
                <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {['Unlimitierte Projekte', 'API-Zugang', 'Compliance-Reports', 'Priority Support', 'Team-Verwaltung'].map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: 'var(--text-secondary)' }}>
                      <Check size={14} weight="bold" color="var(--text-primary)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 0', border: '1px solid rgba(26,23,20,0.2)', fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                  Kontakt aufnehmen
                  <ArrowRight size={14} weight="bold" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
              Alle Pläne inklusive .cursorrules Export, HTTPS und automatische Updates.
            </p>
          </C>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            CTA — bordered box (Optimus: CtaSection)
        ═══════════════════════════════════════════════════════════════ */}
        <section style={{ background: 'var(--active-bg)', padding: 'clamp(60px, 8vw, 80px) 0' }}>
          <C>
            <div className="lp-cta-box-dark" style={{ padding: 'clamp(48px, 6vw, 80px) clamp(32px, 5vw, 64px)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.035em', color: '#ffffff', lineHeight: 0.95, marginBottom: 20 }}>
                    Scan dein Projekt.<br />Bevor es jemand<br />anderes tut.
                  </h2>
                  <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, maxWidth: 420, marginBottom: 36 }}>
                    60 Sekunden. Kostenlos. Keine Kreditkarte.
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link href="/login" className="lp-cta-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', textDecoration: 'none', fontSize: 15, fontWeight: 600, color: '#ffffff' }}>
                      Jetzt kostenlos scannen
                      <ArrowRight size={15} weight="bold" aria-hidden="true" />
                    </Link>
                  </div>
                  <p style={{ marginTop: 20, fontSize: 13, fontFamily: 'var(--font-mono, monospace)', color: 'rgba(255,255,255,0.35)' }}>
                    Keine Kreditkarte erforderlich
                  </p>
                </div>
              </div>
            </div>
          </C>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            FOOTER — (Optimus: FooterSection)
        ═══════════════════════════════════════════════════════════════ */}
        <footer style={{ background: 'var(--bg-base, #EAE9E5)', borderTop: '1px solid var(--border)', padding: 'clamp(48px, 6vw, 72px) 0 28px' }}>
          <C>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 32, marginBottom: 48, flexWrap: 'wrap' }}>
              {/* Brand */}
              <div>
                <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.025em', color: 'var(--text-primary)', display: 'block', marginBottom: 14 }}>
                  Tropen OS
                </span>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 240, marginBottom: 20 }}>
                  Production Readiness Guide für Vibe-Coders. Gebaut in Brandenburg. EU-Server.
                </p>
                <div style={{ display: 'flex', gap: 16 }}>
                  {['GitHub', 'Twitter'].map(s => (
                    <a key={s} href="#" className="lp-footer-link" style={{ marginBottom: 0 }}>{s}</a>
                  ))}
                </div>
              </div>
              {/* Cols */}
              {[
                { title: 'Produkt', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'Kategorien', href: '#kategorien' }] },
                { title: 'Entwickler', links: [{ label: '.cursorrules', href: '#' }, { label: 'Dokumentation', href: '#' }] },
                { title: 'Rechtliches', links: [{ label: 'Impressum', href: '/impressum' }, { label: 'Datenschutz', href: '/datenschutz' }, { label: 'Barrierefreiheit', href: '/barrierefreiheit' }] },
              ].map(col => (
                <div key={col.title}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 16 }}>{col.title}</span>
                  {col.links.map(l => <Link key={l.label} href={l.href} className="lp-footer-link">{l.label}</Link>)}
                </div>
              ))}
            </div>

            <div style={{ paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>© 2026 Tropen OS. All rights reserved.</p>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-tertiary)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
                EU-Server · DSGVO-konform
              </span>
            </div>
          </C>
        </footer>

      </div>
    </>
  )
}
