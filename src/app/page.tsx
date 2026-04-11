import { redirect } from 'next/navigation'

// Redirect root to default locale — next-intl middleware handles this,
// but this is a fallback for direct server renders.
export default function RootPage() {
  redirect('/en')
}
