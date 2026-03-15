'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
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
    <html>
      <body style={{ fontFamily: 'sans-serif', padding: 32, background: '#EAE9E5' }}>
        <h2 style={{ color: '#1A1714' }}>Ein Fehler ist aufgetreten.</h2>
        <p style={{ color: '#4A4540' }}>Das Team wurde automatisch informiert.</p>
        <button
          onClick={reset}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: '#2D7A50',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Erneut versuchen
        </button>
      </body>
    </html>
  )
}
