export default function AdminLoading() {
  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <div className="skeleton" style={{ height: 28, width: 180, borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: 16, width: 240, borderRadius: 'var(--radius-sm)', marginTop: 8 }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-sm)' }} />
        ))}
      </div>
    </div>
  )
}
