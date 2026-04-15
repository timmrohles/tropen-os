// Consumer that imports through a barrel file (not directly from utility)
import { formatDate } from './barrel'

export function renderDate(d: Date): string {
  return formatDate(d)
}
