import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['de', 'en'],
  defaultLocale: 'de',
  // 'always': every locale has an explicit URL prefix → /de/login, /en/login
  localePrefix: 'always',
})

export type Locale = (typeof routing.locales)[number]
