export default function HonestySection() {
  return (
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
                <td style={s.td}>Stanford &bdquo;Price of Prompting&ldquo; (2024)</td>
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
  )
}

const s: Record<string, React.CSSProperties> = {
  sectionMid: {
    background: '#0d0d0d',
    padding: '64px 40px',
  },
  sectionInner: {
    maxWidth: 1100,
    margin: '0 auto',
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
}
