// /welcome — Beta-Onboarding (3 Screens), einmalig
// Auth required. Wenn beta_onboarding_done=true → redirect /audit/scan
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import WelcomeClient from './_components/WelcomeClient'

export const metadata = { title: 'Willkommen — Tropen OS Beta' }

export default async function WelcomePage() {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  // If already done → send to scan
  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('beta_onboarding_done')
    .eq('user_id', user.id)
    .maybeSingle()

  if (prefs?.beta_onboarding_done) {
    redirect(`/${locale}/audit/scan`)
  }

  return (
    <div className="content-narrow">
      <WelcomeClient />
    </div>
  )
}
