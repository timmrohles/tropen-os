import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import Parrot from '@/components/Parrot'
import { Scales, Buildings, Plant } from '@phosphor-icons/react/dist/ssr'
import ToroChatWidget from '@/components/ToroChatWidget'

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.65)',
  borderRadius: 12,
}

// Features für das Grid
const features = [
  {
    icon: <Scales size={28} weight="fill" style={{ color: 'var(--active-bg)' }} />,
    title: 'Responsible AI',
    text: 'Jedes Modell, jede Anfrage, jeder Cent – vollständig sichtbar. Budgets setzen, Modelle freigeben, Kosten kontrollieren. AI ohne Blackbox.'
  },
  {
    icon: <Buildings size={28} weight="fill" style={{ color: 'var(--text-tertiary)' }} />,
    title: 'Team Department',
    text: 'Departments für Teams, Projekte und Abteilungen. Rollen, Einladungen, Zugriffskontrollen – alles auf einer Plattform.'
  },
  {
    icon: <Parrot size={32} />,
    title: 'Toro als Guide',
    text: 'Toro, dein KI-Papagei – er kennt jeden Pfad durch den Informationsdschungel und wählt automatisch das richtige Modell.'
  }
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-[calc(100vh-52px)] flex flex-col">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-8 tracking-wide"
          style={{ ...cardStyle, color: 'var(--active-bg)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block" />
          Verantwortungsvolle KI für den Mittelstand
        </div>

        {/* Titel */}
        <h1
          className="text-6xl font-black tracking-tight leading-none mb-5"
          style={{ color: 'var(--text-primary)' }}
        >
          Tropen OS
        </h1>

        {/* Tagline */}
        <p
          className="text-xl font-medium mb-4 max-w-xl"
          style={{ color: 'var(--text-secondary)' }}
        >
          Der Responsible AI Department für dein Team.
        </p>

        {/* Subtext */}
        <p
          className="text-base max-w-lg leading-relaxed mb-12"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <Parrot size={18} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} /> Toro, dein KI-Papagei – er kennt jeden Pfad durch den Informationsdschungel.<br />
          Transparent, kontrollierbar, europäisch.
        </p>

        {/* CTA */}
        {user ? (
          <div className="flex gap-3">
            <Link
              href="/workspaces"
              className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-black font-semibold px-6 py-3 rounded-lg text-sm transition-colors no-underline"
            >
              Zum Chat →
            </Link>
            <Link
              href="/dashboard"
              className="font-medium px-6 py-3 rounded-lg text-sm transition-colors no-underline"
              style={{
                ...cardStyle,
                color: 'var(--text-primary)',
                border: '1px solid var(--border-medium)',
              }}
            >
              Dashboard
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-black font-semibold px-7 py-3 rounded-lg text-sm transition-colors no-underline"
          >
            Anmelden →
          </Link>
        )}
      </section>

      {/* ── Toro Public Chat ────────────────────────────── */}
      <ToroChatWidget />

      {/* ── Feature Grid ─────────────────────────────────── */}
      <section className="px-6 pb-20 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-6 flex flex-col gap-3"
              style={cardStyle}
            >
              {f.icon}
              <h3
                className="font-semibold text-base"
                style={{ color: 'var(--text-primary)' }}
              >
                {f.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CO₂-Commitment ───────────────────────────────── */}
      <section className="px-6 pb-16 max-w-4xl mx-auto w-full">
        <div
          className="rounded-xl px-8 py-7"
          style={{ ...cardStyle, borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-4">
            <Plant size={18} weight="fill" style={{ color: 'var(--active-bg)', marginTop: 2, flexShrink: 0 }} />
            <div>
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                Responsible AI – auch für den Planeten
              </h3>
              <p
                className="text-sm leading-relaxed max-w-2xl"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Wir planen einen transparenten Aufschlag auf die Modellkosten für CO₂-Ausgleich.
                Eine präzise Berechnung ist heute noch nicht möglich – der Energieverbrauch
                variiert stark je nach Modell, Hardware und Rechenzentrum-Standort.{' '}
                Wir arbeiten an einem ehrlichen Framework dafür. Bis dahin: volle Transparenz
                über Modelle, Kosten und Nutzung – damit ihr selbst entscheiden könnt.
              </p>
              <Link
                href="/responsible-ai"
                className="inline-block mt-4 text-xs transition-colors no-underline"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Mehr erfahren →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer
        className="px-6 py-5 text-center"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Tropen OS – ein Produkt von{' '}
          <span style={{ color: 'var(--text-secondary)' }}>Tropen Agentur</span>
        </p>
      </footer>
    </div>
  )
}
