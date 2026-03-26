/**
 * Minimal i18n placeholder — gibt aktuell nur den deutschen String zurueck.
 *
 * Verwendung:
 *   import { t } from '@/lib/i18n'
 *   <h1>{t('Projekte')}</h1>
 *
 * Spaeter wird diese Funktion durch next-intl ersetzt.
 * Die Aufrufe im Code bleiben dabei bestehen — nur die
 * Implementierung aendert sich.
 *
 * Siehe ADR-004 fuer den Migrationsplan.
 */

const locale = 'de'

/**
 * Translate a string key. Currently returns the key as-is (German).
 * When i18n is activated, this will resolve from message files.
 */
export function t(key: string): string {
  return key
}

/**
 * Get the current locale.
 */
export function getLocale(): string {
  return locale
}

/**
 * Format a date for the current locale.
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, options ?? { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Format a number for the current locale.
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(locale, options)
}

/**
 * Format currency (EUR) for the current locale.
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString(locale, { style: 'currency', currency: 'EUR' })
}
