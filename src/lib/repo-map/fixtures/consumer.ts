// Fixture: a file that imports from both utility and simple-class
import { formatDate, MAX_RETRIES } from './utility'
import { EventLogger } from './simple-class'

export function createLogger(): EventLogger {
  return new EventLogger()
}

export const DEFAULT_RETRIES = MAX_RETRIES
