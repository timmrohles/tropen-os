export default function ProjectsLoading() {
  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <div className="skeleton" style={{ height: 28, width: 120, borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: 16, width: 220, borderRadius: 'var(--radius-sm)', marginTop: 8 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-sm)' }} />
        ))}
      </div>
    </div>
  )
}
