'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="content-full" style={{ textAlign: 'center', paddingTop: 64 }}>
      <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
        Workspace nicht verfügbar.
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Das Team wurde automatisch informiert.
      </p>
      <button className="btn btn-primary" onClick={reset}>
        Erneut versuchen
      </button>
    </div>
  )
}
