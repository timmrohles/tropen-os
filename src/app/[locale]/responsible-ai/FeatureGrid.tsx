const FEATURES = [
  {
    icon: '🦜',
    title: 'Modellkontrolle & Governance',
    text: 'Du entscheidest welche Modelle dein Team nutzen darf. Kein unkontrollierter Zugriff – jede Anfrage läuft durch unsere Governance-Schicht. Budgets, Rollen, Freigaben: alles in deiner Hand.',
  },
  {
    icon: '📊',
    title: 'Kostentransparenz in Echtzeit',
    text: 'Jede Anfrage zeigt Modell, Token-Verbrauch und Kosten. Kein verstecktes Preismodell. Das Dashboard zeigt wer was ausgibt – auf Organisations-, Department- und User-Ebene.',
  },
  {
    icon: '🇪🇺',
    title: 'EU-first & AI Act Ready',
    text: 'Supabase Frankfurt. Europäische Modelle wählbar. DSGVO-konform by Design. Jedes Teammitglied bestätigt aktiv seine KI-Grundkompetenz nach EU AI Act Artikel 4.',
  },
  {
    icon: '🌱',
    title: 'Klimatransparenz',
    text: 'Geschätzter CO₂-Ausstoß pro Anfrage – basierend auf aktuellen Messstudien. Ehrlich, transparent, keine Greenwashing-Versprechen.',
  },
]

export default function FeatureGrid() {
  return (
    <div style={s.section}>
      <div style={s.grid2}>
        {FEATURES.map((card) => (
          <div key={card.title} style={s.featureCard}>
            <span style={s.featureIcon}>{card.icon}</span>
            <p style={s.featureTitle}>{card.title}</p>
            <p style={s.featureText}>{card.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  section: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '64px 40px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 20,
  },
  featureCard: {
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: 12,
    padding: 28,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.7,
    margin: 0,
  },
}
