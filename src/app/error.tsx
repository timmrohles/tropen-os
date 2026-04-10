'use client'

import { useEffect } from 'react'

export default function Error({
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: 16,
      padding: 24,
      textAlign: 'center',
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
        Etwas ist schiefgelaufen
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400 }}>
        {error.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
      </p>
      <button
        className="btn btn-primary"
        onClick={reset}
      >
        Erneut versuchen
      </button>
    </div>
  )
}
