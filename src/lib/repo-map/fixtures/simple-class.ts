// Fixture: a class that imports from utility
import { formatDate, DateRange } from './utility'

export class EventLogger {
  private entries: string[] = []

  log(event: string, range: DateRange): void {
    this.entries.push(`[${formatDate(range.start)}] ${event}`)
  }

  getEntries(): string[] {
    return this.entries
  }
}

function internalHelper(): void {
  // not exported
}
