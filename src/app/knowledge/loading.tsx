export default function KnowledgeLoading() {
  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <div className="skeleton" style={{ height: 28, width: 180, borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ height: 16, width: 260, borderRadius: 'var(--radius-sm)', marginTop: 8 }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-sm)' }} />
        ))}
      </div>
    </div>
  )
}
