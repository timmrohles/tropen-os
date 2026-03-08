import Link from 'next/link'

export default function ResponsibleAIPage() {
  return (
    <div style={s.page}>

      {/* ── 1. HERO ── */}
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

      {/* ── 2. FEATURE GRID ── */}
      <div style={s.section}>
        <div style={s.grid2}>
          {[
            {
              icon: '🦜',
              title: 'Modellkontrolle & Governance',
              text: 'Du entscheidest welche Modelle dein Team nutzen darf. Kein unkontrollierter Zugriff – jede Anfrage läuft durch unsere Governance-Schicht. Budgets, Rollen, Freigaben: alles in deiner Hand.',
            },
            {
              icon: '📊',
              title: 'Kostentransparenz in Echtzeit',
              text: 'Jede Anfrage zeigt Modell, Token-Verbrauch und Kosten. Kein verstecktes Preismodell. Das Dashboard zeigt wer was ausgibt – auf Organisations-, Workspace- und User-Ebene.',
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
          ].map((card) => (
            <div key={card.title} style={s.featureCard}>
              <span style={s.featureIcon}>{card.icon}</span>
              <p style={s.featureTitle}>{card.title}</p>
              <p style={s.featureText}>{card.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. KLIMATRANSPARENZ TIMELINE ── */}
      <div style={s.sectionDark}>
        <div style={s.sectionInner}>
          <h2 style={s.sectionTitle}>🌱 Klimatransparenz – ehrlich und offen</h2>
          <div style={s.timelineRow}>

            {/* Step 1 */}
            <div style={s.timelineStep}>
              <div style={s.timelineCircle}>①</div>
              <p style={s.timelineStepTitle}>Modellklasse bestimmt Verbrauch</p>
              <p style={s.timelineText}>
                Toro wählt automatisch das passende Modell. Leichte Tasks → energieeffiziente Modelle.
                Komplexe Analysen → stärkere Modelle. Effizienz ist eingebaut.
              </p>
            </div>

            {/* Step 2 */}
            <div style={s.timelineStep}>
              <div style={s.timelineCircle}>②</div>
              <p style={s.timelineStepTitle}>Echtzeit-Schätzung pro Anfrage</p>
              <p style={s.timelineText}>Jede Anfrage liefert eine CO₂-Schätzung auf Basis aktueller Emissionsfaktoren.</p>
              <div style={s.codeBox}>
                <span>Beispiel: Llama 3 70B</span>
                <span>1.000 Tokens</span>
                <span>× 0,8 kWh/Mio. Tokens</span>
                <span>= 0,0008 kWh</span>
                <span>× 0,33 kg CO₂/kWh</span>
                <span>= ~0,000264 kg CO₂</span>
                <span>&nbsp;</span>
                <span>Range: 0,0002 – 0,0004 kg CO₂</span>
                <span>Genauigkeit: ±30–50%</span>
              </div>
            </div>

            {/* Step 3 */}
            <div style={s.timelineStep}>
              <div style={s.timelineCircle}>③</div>
              <p style={s.timelineStepTitle}>Klima+ Aufschlag</p>
              <p style={s.timelineText}>Optionaler Kompensations-Aufschlag für zertifizierte CO₂-Projekte.</p>
              <div style={s.lockedCard}>
                <span style={s.lockIcon}>🔒</span>
                <p style={s.lockedLine}>Standard (0€): Nur die Information</p>
                <p style={s.lockedLine}>Klima+ (~0,03–0,06€/Mio. Tokens): 100–200% Kompensation</p>
                <p style={s.lockedLine}>→ Direkt in zertifizierte CO₂-Projekte</p>
                <span style={s.comingSoonBadge}>coming soon</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 4. EHRLICHKEITS-SEKTION ── */}
      <div style={s.sectionMid}>
        <div style={s.sectionInner}>
          <div style={s.honestyBox}>
            <p style={s.honestyTitle}>Was wir wissen – und was nicht.</p>
            <p style={s.honestySubtext}>Unsere Zahlen sind Annäherungen, keine exakten Messungen.</p>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Was</th>
                  <th style={s.th}>Wert</th>
                  <th style={s.th}>Quelle</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={s.td}>Energie pro Token</td>
                  <td style={s.td}>~5×10⁻⁷ kWh/Token</td>
                  <td style={s.td}>Stanford „Price of Prompting" (2024)</td>
                </tr>
                <tr>
                  <td style={s.td}>DE-Strommix</td>
                  <td style={s.td}>~0,33 kg CO₂/kWh</td>
                  <td style={s.td}>Umweltbundesamt 2024</td>
                </tr>
                <tr>
                  <td style={s.td}>Scope</td>
                  <td style={s.td}>Scope 3 (externe Rechenleistung)</td>
                  <td style={s.td}>GHG Protocol</td>
                </tr>
                <tr>
                  <td style={s.tdLast}>Genauigkeit</td>
                  <td style={s.tdLast}>±30–50%</td>
                  <td style={s.tdLast}>–</td>
                </tr>
              </tbody>
            </table>
            <p style={s.honestyFooter}>
              Wir aktualisieren die Faktoren jährlich und dokumentieren jede Änderung öffentlich. Versprochen.
            </p>
          </div>
        </div>
      </div>

      {/* ── 5. WARUM DAS WICHTIG IST ── */}
      <div style={s.sectionDarkBg}>
        <div style={s.sectionInner}>
          <h2 style={s.whyTitle}>Warum das wichtig ist</h2>
          <div style={s.grid4}>
            {[
              {
                icon: '👤',
                title: 'Für dich',
                text: 'Volle Transparenz bei KI-Nutzung. EU AI Act konform. Keine Blackbox.',
              },
              {
                icon: '👥',
                title: 'Für dein Team',
                text: 'Bewusster Umgang mit KI von Anfang an. KI-Kompetenz als Standard, nicht als Option.',
              },
              {
                icon: '🏢',
                title: 'Für uns',
                text: 'Nachhaltigkeit ist keine Marketingaussage – es ist Infrastruktur. Wir bauen es ein.',
              },
              {
                icon: '🌍',
                title: 'Für den Planeten',
                text: 'Jeder Token zählt. Gemeinsam kompensieren wir.',
              },
            ].map((card) => (
              <div key={card.title} style={s.whyCard}>
                <span style={s.whyIcon}>{card.icon}</span>
                <p style={s.whyCardTitle}>{card.title}</p>
                <p style={s.whyCardText}>{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. QUELLEN & METHODIK ── */}
      <div style={s.sectionMid}>
        <div style={s.sectionInner}>
          <h2 style={s.sourcesTitle}>Quellen &amp; Methodik</h2>
          <div style={s.sourcesList}>
            <p style={s.sourceItem}>
              Stanford University: „The Price of Prompting" –{' '}
              <Link href="https://arxiv.org/abs/2407.16893" target="_blank" rel="noopener noreferrer" style={s.sourceLink}>
                arxiv.org/abs/2407.16893
              </Link>
            </p>
            <p style={s.sourceItem}>
              Umweltbundesamt: Strommix Deutschland 2024 –{' '}
              <Link href="https://www.nowtricity.com/country/germany/" target="_blank" rel="noopener noreferrer" style={s.sourceLink}>
                nowtricity.com/country/germany
              </Link>
            </p>
            <p style={s.sourceItem}>
              GHG Protocol: Scope 3 Standard –{' '}
              <Link href="https://ghgprotocol.org" target="_blank" rel="noopener noreferrer" style={s.sourceLink}>
                ghgprotocol.org
              </Link>
            </p>
            <p style={s.sourceItem}>
              Electricity Maps API (für zukünftige Echtzeit-Daten) –{' '}
              <Link href="https://electricitymaps.com" target="_blank" rel="noopener noreferrer" style={s.sourceLink}>
                electricitymaps.com
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── 7. CTA FOOTER ── */}
      <div style={s.ctaSection}>
        <span style={s.ctaIcon}>🦜</span>
        <p style={s.ctaQuote}>
          „Ich finde, Transparenz ist der erste Schritt zu verantwortungsvoller KI-Nutzung."
        </p>
        <p style={s.ctaAttribution}>– Toro</p>
        <div style={s.ctaButtons}>
          <Link href="/workspaces" style={s.ctaBtnPrimary}>Tropen OS ausprobieren →</Link>
          <Link href="/" style={s.ctaBtnSecondary}>Zur Startseite</Link>
        </div>
      </div>

    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    backgroundColor: '#0a0a0a',
    minHeight: '100vh',
    color: '#fff',
  },

  // ── Hero ──
  hero: {
    background: 'linear-gradient(135deg, #0f4c4c, #134e4a)',
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
    color: '#14b8a6',
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
    background: 'rgba(20,184,166,0.15)',
    border: '1px solid #14b8a6',
    color: '#14b8a6',
    borderRadius: 20,
    padding: '6px 14px',
    fontSize: 13,
  },

  // ── Feature Grid ──
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

  // ── Timeline ──
  sectionDark: {
    background: '#0a0a0a',
    padding: '64px 40px',
  },
  sectionInner: {
    maxWidth: 1100,
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 48,
    marginTop: 0,
  },
  timelineRow: {
    display: 'flex',
    gap: 32,
    alignItems: 'flex-start',
  },
  timelineStep: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  timelineCircle: {
    width: 36,
    height: 36,
    background: '#14b8a6',
    color: '#000',
    borderRadius: '50%',
    fontWeight: 700,
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timelineStepTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  timelineText: {
    fontSize: 13,
    color: '#666',
    margin: 0,
    lineHeight: 1.6,
  },
  codeBox: {
    background: '#18181b',
    border: '1px solid #14b8a6',
    borderRadius: 8,
    padding: 14,
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 1.8,
    display: 'flex',
    flexDirection: 'column',
  },
  lockedCard: {
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: 8,
    padding: 16,
    opacity: 0.7,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  lockIcon: {
    fontSize: 20,
  },
  lockedLine: {
    fontSize: 13,
    color: '#888',
    margin: 0,
  },
  comingSoonBadge: {
    background: '#1e1e1e',
    color: '#555',
    fontSize: 10,
    borderRadius: 4,
    padding: '2px 6px',
    alignSelf: 'flex-start',
    marginTop: 4,
  },

  // ── Honesty / Table ──
  sectionMid: {
    background: '#0d0d0d',
    padding: '64px 40px',
  },
  honestyBox: {
    background: '#18181b',
    border: '1px solid #292524',
    borderLeft: '3px solid #f59e0b',
    borderRadius: 8,
    padding: 28,
  },
  honestyTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    marginTop: 0,
    marginBottom: 8,
  },
  honestySubtext: {
    fontSize: 13,
    color: '#666',
    margin: 0,
    marginBottom: 24,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    borderBottom: '1px solid #2a2a2a',
    fontSize: 11,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    textAlign: 'left',
    padding: '0 8px 12px 8px',
    fontWeight: 600,
  },
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid #1e1e1e',
    fontSize: 13,
    color: '#aaa',
  },
  tdLast: {
    padding: '12px 8px',
    fontSize: 13,
    color: '#aaa',
  },
  honestyFooter: {
    marginTop: 20,
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 0,
  },

  // ── Why ──
  sectionDarkBg: {
    background: '#0a0a0a',
    padding: '64px 40px',
  },
  whyTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 32,
    marginTop: 0,
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
  },
  whyCard: {
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: 10,
    padding: 20,
  },
  whyIcon: {
    fontSize: 24,
  },
  whyCardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e5e5e5',
    marginTop: 8,
    marginBottom: 8,
  },
  whyCardText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 1.6,
    margin: 0,
  },

  // ── Sources ──
  sourcesTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#888',
    marginBottom: 20,
    marginTop: 0,
  },
  sourcesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sourceItem: {
    fontSize: 13,
    color: '#555',
    margin: 0,
  },
  sourceLink: {
    color: '#14b8a6',
    textDecoration: 'none',
  },

  // ── CTA Footer ──
  ctaSection: {
    background: 'linear-gradient(135deg, #0f4c4c, #134e4a)',
    padding: '64px 40px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  ctaIcon: {
    fontSize: 48,
  },
  ctaQuote: {
    fontStyle: 'italic',
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    maxWidth: 500,
    margin: '24px auto 0',
    lineHeight: 1.6,
  },
  ctaAttribution: {
    fontSize: 14,
    color: '#14b8a6',
    marginTop: 8,
  },
  ctaButtons: {
    display: 'flex',
    gap: 12,
    marginTop: 32,
    justifyContent: 'center',
  },
  ctaBtnPrimary: {
    background: '#14b8a6',
    color: '#000',
    padding: '12px 24px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    textDecoration: 'none',
  },
  ctaBtnSecondary: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.7)',
    padding: '12px 24px',
    borderRadius: 8,
    fontSize: 14,
    textDecoration: 'none',
  },
}
