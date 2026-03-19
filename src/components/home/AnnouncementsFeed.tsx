interface Announcement {
  id: string
  title: string
  body: string | null
  url: string | null
  url_label: string | null
  type: string
  source: string
  published_at: string
}

interface Props {
  announcements: Announcement[]
  orgName: string
}

export default function AnnouncementsFeed({ announcements, orgName }: Props) {
  return (
    <div className="card" style={{ marginBottom: 24 }} role="feed" aria-label="Neuigkeiten">
      <div className="card-header">
        <span className="card-header-label">Neuigkeiten</span>
      </div>
      <div className="card-body">
        {announcements.map(a => (
          <article key={a.id} className="list-row" style={{ cursor: 'default' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px',
                borderRadius: 4,
                background: a.source === 'tropen' ? 'var(--accent)' : 'var(--active-bg)',
                color: 'var(--text-inverse)', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {a.source === 'tropen' ? 'Tropen' : orgName}
              </span>
              <span style={{
                fontSize: 14, color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {a.title}
              </span>
            </div>
            {a.url && (
              <a
                href={a.url}
                style={{
                  fontSize: 13, color: 'var(--accent)',
                  whiteSpace: 'nowrap', marginLeft: 12, flexShrink: 0,
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                {a.url_label || 'Mehr →'}
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
