import { redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/utils/supabase/server'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import HowItWorksClient from './_lp/HowItWorksClient'
import { LpPricing } from './_lp/LpPricing'
import { LpCta } from './_lp/LpCta'
import { LpFooter } from './_lp/LpFooter'
import { LpLocaleSwitcher } from './_lp/LpLocaleSwitcher'
import { getLpContent } from './_lp/lp-content'

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

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const c = getLpContent(locale)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(`/${locale}/dashboard`)

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
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.025em', color: '#ffffff' }}>
                Tropen OS
              </span>
            </Link>
            <nav aria-label="Primäre Navigation" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              {c.nav.links.map(l => (
                <a key={l.label} href={l.href} className="lp-nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>{l.label}</a>
              ))}
              <LpLocaleSwitcher currentLocale={locale} />
              <Link href="/login" className="btn btn-primary" style={{ fontSize: 13, padding: '7px 18px', textDecoration: 'none' }}>
                {c.nav.cta}
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
              <span style={{ display: 'block' }}>{c.hero.h1[0]}</span>
              <span style={{ display: 'block' }}>{c.hero.h1[1]}</span>
              <span style={{ display: 'block', color: 'rgba(255,255,255,0.35)' }}>{c.hero.h1[2]}</span>
            </h1>

            {/* Optimus pattern: 2-col grid — description left, CTAs right */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px 80px', alignItems: 'end' }}>
              <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 480 }}>
                {c.hero.sub.split('\n').map((line, i) => <span key={i} style={{ display: 'block' }}>{line}</span>)}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <Link href="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '13px 26px', fontSize: 15, fontWeight: 600 }}>
                  {c.hero.ctaPrimary}
                  <ArrowRight size={15} weight="bold" aria-hidden="true" style={{ transition: 'transform 200ms' }} />
                </Link>
                <Link href="#" className="btn btn-ghost lp-ghost-dark" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', padding: '13px 22px', fontSize: 15 }}>
                  {c.hero.ctaSecondary}
                </Link>
              </div>
            </div>
          </C>

          {/* Stats marquee pinned at bottom of hero */}
          <div className="lp-ticker-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '18px 0' }} aria-hidden="true">
            <div className="lp-ticker-inner">
              {[...c.stats, ...c.stats].map((s, i) => (
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
          <p className="lp-sr">{c.stats.map(s => `${s.value} ${s.text}`).join(' · ')}</p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            CAPABILITIES 01–04 — light (Optimus: FeaturesSection)
        ═══════════════════════════════════════════════════════════════ */}
        <section id="features" style={{ background: 'var(--bg-base)', padding: 'clamp(72px, 10vw, 96px) 0' }}>
          <C>
            <div style={{ marginBottom: 'clamp(48px, 6vw, 64px)' }}>
              <Tag>{c.features.tag}</Tag>
              <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.05 }}>
                {c.features.h2[0]}<br />
                <span style={{ color: 'var(--text-tertiary)' }}>{c.features.h2[1]}</span>
              </h2>
            </div>

            {c.features.items.map(f => (
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
              <Tag dark>{c.howItWorks.tag}</Tag>
              <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', lineHeight: 1.05 }}>
                {c.howItWorks.h2[0]}<br />
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>{c.howItWorks.h2[1]}</span>
              </h2>
            </div>

            <HowItWorksClient steps={c.howItWorks.steps} badgeRules={c.categories.badgeRules} />
          </C>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            CATEGORIES — light
        ═══════════════════════════════════════════════════════════════ */}
        <section id="kategorien" style={{ background: 'var(--bg-base)', padding: 'clamp(72px, 10vw, 96px) 0' }}>
          <C>
            <div style={{ maxWidth: 720, marginBottom: 48 }}>
              <Tag>{c.categories.tag}</Tag>
              <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.05 }}>
                {c.categories.h2[0]}<br />
                <span style={{ color: 'var(--text-tertiary)' }}>{c.categories.h2[1]}</span>
              </h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {c.categories.items.map(cat => (
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
                <Tag dark>{c.compliance.tag}</Tag>
                <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', lineHeight: 1.05, marginBottom: 20 }}>
                  {c.compliance.h2[0]}<br />{c.compliance.h2[1]}<br />{c.compliance.h2[2]}
                </h2>
                <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 28, maxWidth: 380 }}>
                  {c.compliance.sub}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {c.compliance.cards.map(card => (
                    <span key={card.title} style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', padding: '6px 14px', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.02em' }}>
                      {card.title}
                    </span>
                  ))}
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', padding: '6px 14px', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.02em' }}>
                    WCAG 2.1 AA
                  </span>
                </div>
              </div>
              {/* Right — feature cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {c.compliance.cards.map(item => (
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
        <section style={{ background: 'var(--bg-base)', padding: 'clamp(72px, 10vw, 96px) 0' }}>
          <C style={{ textAlign: 'center' }}>
            <Tag>{c.tools.tag}</Tag>
            <h2 style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.05, marginBottom: 12 }}>
              {c.tools.h2}
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-tertiary)', marginBottom: 44 }}>{c.tools.sub}</p>
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

        <LpPricing locale={locale} />

        <LpCta locale={locale} />
        <LpFooter locale={locale} />

      </div>
    </>
  )
}
