export default function FeedsLoading() {
  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <div className="skeleton" style={{ height: 28, width: 160, borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: 16, width: 240, borderRadius: 'var(--radius-sm)', marginTop: 8 }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {[80, 60, 70].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 32, width: w, borderRadius: 16 }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-sm)' }} />
        ))}
      </div>
    </div>
  )
}
