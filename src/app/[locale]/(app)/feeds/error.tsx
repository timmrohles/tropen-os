'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function FeedsError({
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
    <div className="content-max" style={{ textAlign: 'center' }}>
      <h2 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
        Feeds konnten nicht geladen werden.
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
