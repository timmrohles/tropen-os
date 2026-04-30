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

function _internalHelper(): void {
  // not exported — kept as fixture for repo-map symbol extraction tests
}
