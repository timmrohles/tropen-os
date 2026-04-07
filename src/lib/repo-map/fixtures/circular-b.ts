// Fixture: circular import (b → a)
import { valueA } from './circular-a'
export const valueB = `b+${valueA}`
