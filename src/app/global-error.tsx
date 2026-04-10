'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="de">
      <body style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 16,
        padding: 24,
        textAlign: 'center',
        fontFamily: 'sans-serif',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>
          Kritischer Fehler
        </h2>
        <p style={{ fontSize: 14, color: '#666', maxWidth: 400 }}>
          {error.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
        </p>
        <button
          onClick={reset}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Erneut versuchen
        </button>
      </body>
    </html>
  )
}
