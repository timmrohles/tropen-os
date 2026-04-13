import { Link } from '@/i18n/navigation'

export default function HeroSection() {
  return (
    <div style={s.hero}>
      <div style={s.heroInner}>
        <Link href="/" style={s.breadcrumb}>← Startseite</Link>
        <div style={s.heroContent}>
          <span style={s.heroIcon}>🦜</span>
          <p style={s.heroLabel}>Responsible AI</p>
          <h1 style={s.heroH1}>Transparenz ist kein Feature. Es ist unser Versprechen.</h1>
          <p style={s.heroSub}>
            KI-Nutzung hat Konsequenzen – für dein Unternehmen, deine Compliance und den Planeten.
            Tropen OS macht all das sichtbar.
          </p>
          <span style={s.heroBadge}>🌱 In aktiver Entwicklung</span>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  hero: {
    background: 'linear-gradient(135deg, #1a2d10, #1e3818)',
    padding: '80px 40px',
    position: 'relative',
  },
  heroInner: {
    maxWidth: 1100,
    margin: '0 auto',
  },
  breadcrumb: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: 40,
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
  },
  heroIcon: {
    fontSize: 48,
  },
  heroLabel: {
    color: 'var(--accent)',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    margin: 0,
  },
  heroH1: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 800,
    margin: 0,
    lineHeight: 1.2,
    maxWidth: 700,
  },
  heroSub: {
    color: '#94a3b8',
    fontSize: 18,
    margin: 0,
    maxWidth: 620,
    lineHeight: 1.6,
  },
  heroBadge: {
    background: 'rgba(163,181,84,0.15)',
    border: '1px solid var(--accent)',
    color: 'var(--accent)',
    borderRadius: 20,
    padding: '6px 14px',
    fontSize: 13,
  },
}
