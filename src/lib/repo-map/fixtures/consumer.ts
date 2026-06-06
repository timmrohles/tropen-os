// Fixture: a file that imports from both utility and simple-class
import { MAX_RETRIES, formatDate } from './utility'
import { EventLogger } from './simple-class'

export function createLogger(): EventLogger {
  return new EventLogger()
}

export const DEFAULT_RETRIES = MAX_RETRIES

// Second direct importer of formatDate (utility) — exercises multi-importer refCount
export function timestamp(d: Date): string {
  return formatDate(d)
}
