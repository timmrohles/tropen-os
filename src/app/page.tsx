import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import Parrot from '@/components/Parrot'
import { Scales, Buildings, Plant } from '@phosphor-icons/react/dist/ssr'

// Features für das Grid
const features = [
  {
    icon: <Scales size={28} weight="duotone" style={{ color: '#14b8a6' }} />,
    title: 'Responsible AI',
    text: 'Jedes Modell, jede Anfrage, jeder Cent – vollständig sichtbar. Budgets setzen, Modelle freigeben, Kosten kontrollieren. AI ohne Blackbox.'
  },
  {
    icon: <Buildings size={28} weight="duotone" style={{ color: '#a1a1aa' }} />,
    title: 'Team Workspace',
    text: 'Workspaces für Teams, Projekte und Abteilungen. Rollen, Einladungen, Zugriffskontrollen – alles auf einer Plattform.'
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
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 flex-1">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 text-xs text-teal-400 font-medium mb-8 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
          Verantwortungsvolle KI für den Mittelstand
        </div>

        {/* Titel */}
        <h1 className="text-6xl font-black text-white tracking-tight leading-none mb-5">
          Tropen OS
        </h1>

        {/* Tagline */}
        <p className="text-xl text-zinc-300 font-medium mb-4 max-w-xl">
          Der Responsible AI Workspace für dein Team.
        </p>

        {/* Subtext */}
        <p className="text-base text-zinc-500 max-w-lg leading-relaxed mb-12">
          <Parrot size={18} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} /> Toro, dein KI-Papagei – er kennt jeden Pfad durch den Informationsdschungel.<br />
          Transparent, kontrollierbar, europäisch.
        </p>

        {/* CTA */}
        {user ? (
          <div className="flex gap-3">
            <Link
              href="/workspaces"
              className="bg-teal-500 hover:bg-teal-400 text-black font-semibold px-6 py-3 rounded-lg text-sm transition-colors no-underline"
            >
              Zum Workspace →
            </Link>
            <Link
              href="/dashboard"
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium px-6 py-3 rounded-lg text-sm transition-colors no-underline"
            >
              Dashboard
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="bg-teal-500 hover:bg-teal-400 text-black font-semibold px-7 py-3 rounded-lg text-sm transition-colors no-underline"
          >
            Anmelden →
          </Link>
        )}
      </section>

      {/* ── Feature Grid ─────────────────────────────────── */}
      <section className="px-6 pb-20 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-3"
            >
              {f.icon}
              <h3 className="text-white font-semibold text-base">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CO₂-Commitment ───────────────────────────────── */}
      <section className="px-6 pb-16 max-w-4xl mx-auto w-full">
        <div className="border-t border-teal-900 bg-zinc-900 rounded-xl px-8 py-7">
          <div className="flex items-start gap-4">
            <Plant size={18} weight="duotone" style={{ color: '#14b8a6', marginTop: 2, flexShrink: 0 }} />
            <div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-3">
                Responsible AI – auch für den Planeten
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl">
                Wir planen einen transparenten Aufschlag auf die Modellkosten für CO₂-Ausgleich.
                Eine präzise Berechnung ist heute noch nicht möglich – der Energieverbrauch
                variiert stark je nach Modell, Hardware und Rechenzentrum-Standort.{' '}
                Wir arbeiten an einem ehrlichen Framework dafür. Bis dahin: volle Transparenz
                über Modelle, Kosten und Nutzung – damit ihr selbst entscheiden könnt.
              </p>
              <a
                href="/responsible-ai"
                className="inline-block mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors no-underline"
              >
                Mehr erfahren →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-zinc-900 px-6 py-5 text-center">
        <p className="text-xs text-zinc-600">
          Tropen OS – ein Produkt von{' '}
          <span className="text-zinc-500">Tropen Agentur</span>
        </p>
      </footer>
    </div>
  )
}
