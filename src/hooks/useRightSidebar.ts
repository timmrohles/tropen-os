/* eslint-disable unicorn/filename-case */
'use client'

import { useEffect, useState } from 'react'

export function useRightSidebar(key: string, defaultOpen = true) {
  const [open, setOpen] = useState(defaultOpen)

  useEffect(() => {
    const stored = localStorage.getItem(`right-sidebar-${key}`)
    if (stored !== null) setOpen(stored === 'true')
  }, [key])

  function toggle() {
    setOpen(o => {
      const next = !o
      localStorage.setItem(`right-sidebar-${key}`, String(next))
      return next
    })
  }

  return { open, toggle }
}
