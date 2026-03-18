export default function ClimateTimeline() {
  return (
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
  )
}

const s: Record<string, React.CSSProperties> = {
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
    background: 'var(--accent)',
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
    border: '1px solid var(--accent)',
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
}
