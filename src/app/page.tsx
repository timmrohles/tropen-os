import { redirect } from 'next/navigation'

// next-intl middleware redirects / → /de automatically.
// This is a safety net for environments without middleware (e.g. unit tests).
export default function RootPage() {
  redirect('/de')
}
