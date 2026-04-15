// Consumer that imports through a wildcard barrel re-export
import { formatDate } from './barrel-wildcard'

export function renderWildcard(d: Date): string {
  return formatDate(d)
}
