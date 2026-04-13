import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

export default async function WissenPage() {
  const locale = await getLocale()
  redirect(`/${locale}/settings#ki-kontext`)
}
