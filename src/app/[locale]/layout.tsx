import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import ImpersonationBanner from '@/components/ImpersonationBanner'
import CookieBanner from '@/components/CookieBanner'
import AxeHelper from '@/components/AxeHelper'

interface Props {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'de')) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <Suspense>
        <ImpersonationBanner />
      </Suspense>
      {children}
      <CookieBanner />
      <AxeHelper />
    </NextIntlClientProvider>
  )
}
