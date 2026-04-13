import Link from 'next/link'

interface Props {
  currentLocale: string
}

export function LpLocaleSwitcher({ currentLocale }: Props) {
  const btnStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 11,
    fontFamily: 'var(--font-mono, monospace)',
    fontWeight: active ? 700 : 400,
    letterSpacing: '0.08em',
    color: active ? '#ffffff' : 'rgba(255,255,255,0.38)',
    textDecoration: 'none',
    padding: '3px 7px',
    borderRadius: 3,
    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
  })

  // With localePrefix:'always': both locales have explicit prefix
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1 }} aria-label="Sprache wählen">
      <Link href="/de" style={btnStyle(currentLocale === 'de')} aria-current={currentLocale === 'de' ? 'true' : undefined}>
        DE
      </Link>
      <span aria-hidden="true" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, padding: '0 1px' }}>|</span>
      <Link href="/en" style={btnStyle(currentLocale === 'en')} aria-current={currentLocale === 'en' ? 'true' : undefined}>
        EN
      </Link>
    </div>
  )
}
