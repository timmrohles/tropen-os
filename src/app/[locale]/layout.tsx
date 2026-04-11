import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import ConditionalAppShell from '@/components/layout/ConditionalAppShell'
import ImpersonationBanner from '@/components/ImpersonationBanner'

interface Props {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'de')) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <Suspense>
        <ImpersonationBanner />
      </Suspense>
      <Suspense>
        <ConditionalAppShell>
          {children}
        </ConditionalAppShell>
      </Suspense>
    </NextIntlClientProvider>
  )
}
