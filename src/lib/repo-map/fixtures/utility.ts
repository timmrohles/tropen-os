// Fixture: a utility module exporting a function and a constant
export const MAX_RETRIES = 3

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export interface DateRange {
  start: Date
  end: Date
}
