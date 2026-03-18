'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const version = process.env.NEXT_PUBLIC_BUILD_TIME ?? 'v1'
    navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: '/' }).catch((err) => {
      console.warn('[SW] Registrierung fehlgeschlagen:', err)
    })
  }, [])

  return null
}
