// Fixture: circular import (a → b → a)
import { valueB } from './circular-b'
export const valueA = `a+${valueB}`
