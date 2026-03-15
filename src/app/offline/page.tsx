'use client'

import React from 'react'

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base, var(--bg-base))',
      color: 'var(--text-primary, var(--text-primary))',
      gap: 16,
      padding: 24,
      textAlign: 'center',
    }}>
      <svg width="64" height="64" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M18 4 C16 2, 13 2, 12 4 C11 6, 13 7, 14 6 C14 8, 16 8, 17 7 C17 9, 19 8, 18 6 Z" fill="#235f3e"/>
        <ellipse cx="15" cy="18" rx="8" ry="9" fill="var(--accent)"/>
        <circle cx="19" cy="10" r="6" fill="var(--accent)"/>
        <path d="M9 16 C7 18, 7 22, 9 24 C11 22, 12 19, 11 16 Z" fill="#235f3e"/>
        <ellipse cx="15" cy="20" rx="4" ry="5" fill="#3a9163"/>
        <circle cx="21" cy="9" r="2.2" fill="#fff"/>
        <circle cx="21.5" cy="9" r="1.1" fill="var(--text-primary)"/>
        <circle cx="21.9" cy="8.4" r="0.45" fill="#fff"/>
        <path d="M24.5 10.5 C26.5 10, 27 11.5, 25.5 12.5 C24.5 13, 23.5 12.5, 23.5 11.5 Z" fill="#fff"/>
        <path d="M24 12.5 C25.5 12.5, 26 13.5, 25 14 C24 14.5, 23 13.5, 23.5 12.5 Z" fill="#e8e5e0"/>
        <path d="M10 24 C8 26, 7 29, 9 30 C10 28, 12 27, 12 25 Z" fill="#235f3e"/>
        <path d="M13 25 C12 28, 12 31, 14 31 C14.5 29, 15 27, 15 25 Z" fill="var(--accent)"/>
        <path d="M16 25 C16 28, 17 30, 19 30 C18.5 28, 18 26, 17 25 Z" fill="#235f3e"/>
      </svg>

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          Keine Verbindung
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary, var(--text-secondary))', marginTop: 8, maxWidth: 320 }}>
          Toro ist gerade nicht erreichbar. Bitte prüfe deine Internetverbindung und versuche es erneut.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        style={{
          background: 'var(--accent)',
          border: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          color: '#0d2418',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          marginTop: 8,
        }}
      >
        Erneut versuchen
      </button>
    </div>
  )
}
