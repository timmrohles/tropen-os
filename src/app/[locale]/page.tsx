import { redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/utils/supabase/server'
import { HeroSection } from '@/components/landing/HeroSection'
import { UseCaseSecurity } from '@/components/landing/UseCaseSecurity'
import { UseCasePerformance } from '@/components/landing/UseCasePerformance'
import { UseCaseCompliance } from '@/components/landing/UseCaseCompliance'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { LpPricing } from './_lp/LpPricing'
import { LpFooter } from './_lp/LpFooter'
import { LpLocaleSwitcher } from './_lp/LpLocaleSwitcher'
import { getLpContent } from './_lp/lp-content'

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
        /* Nav hover underline */
        .lp-nav-link { position: relative; color: rgba(255,255,255,0.65); }
        .lp-nav-link::after {
          content: '';
          position: absolute; bottom: -2px; left: 0;
          width: 0; height: 1px;
          background: #ffffff;
          transition: width 280ms;
        }
        .lp-nav-link:hover::after { width: 100%; }
        .lp-nav-link:hover { color: rgba(255,255,255,0.95); }

        /* Screen-reader only */
        .lp-sr {
          position: absolute; width: 1px; height: 1px;
          overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap;
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

        /* Pricing grid */
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

        /* CTA box corners */
        .lp-cta-box {
          border: 1px solid var(--border-strong);
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

        /* CTA accent button */
        .lp-cta-accent {
          background: var(--accent) !important;
          color: #ffffff !important;
          transition: filter 150ms;
        }
        .lp-cta-accent:hover { filter: brightness(1.15); }
      `}</style>

      <div style={{ minHeight: '100vh', fontFamily: 'var(--font-sans, Inter, sans-serif)', color: 'var(--text-primary)' }}>

        {/* ── NAV — Schiefer-Dark ─────────────────────────────────────────── */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(30,37,48,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(20px, 5vw, 56px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.025em', color: '#ffffff' }}>
                Prodify
              </span>
            </Link>
            <nav aria-label="Primäre Navigation" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              {c.nav.links.map(l => (
                <a key={l.label} href={l.href} className="lp-nav-link" style={{ fontSize: 13, textDecoration: 'none', transition: 'color 150ms' }}>{l.label}</a>
              ))}
              <LpLocaleSwitcher currentLocale={locale} />
              <Link href="/login" className="btn btn-primary" style={{ fontSize: 13, padding: '7px 18px', textDecoration: 'none' }}>
                {c.nav.cta}
              </Link>
            </nav>
          </div>
        </header>

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <div style={{ paddingTop: 64 }}>
          <HeroSection locale={locale} />
        </div>

        {/* ── USE CASES ──────────────────────────────────────────────────── */}
        <UseCaseSecurity />
        <UseCasePerformance />
        <UseCaseCompliance />

        {/* ── PRICING ────────────────────────────────────────────────────── */}
        <LpPricing locale={locale} />

        {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
        <FinalCTA locale={locale} />

        <LpFooter locale={locale} />

      </div>
    </>
  )
}
