'use client'

import { usePathname } from 'next/navigation'
import AppShell from './AppShell'

// Paths that render WITHOUT the app shell (no sidebar, no mobile nav)
const NO_SHELL_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/onboarding',
  '/shared/',  // public shared workspace pages — no auth required
]

export default function ConditionalAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const noShell = NO_SHELL_PREFIXES.some(p => pathname.startsWith(p))

  if (noShell) {
    return <main>{children}</main>
  }

  return <AppShell>{children}</AppShell>
}
