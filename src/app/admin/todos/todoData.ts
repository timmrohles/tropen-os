import type { Todo } from './todo.types'
import { TODOS_FEATURES } from './todoDataFeatures'
import { TODOS_OPS } from './todoDataOps'

// Barrel: merges feature todos + ops todos into single array
export const TODOS: Todo[] = [...TODOS_FEATURES, ...TODOS_OPS]
