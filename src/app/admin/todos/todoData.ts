import type { Todo } from './todo.types'
import { TODOS_FEATURES } from './todoDataFeatures'
import { TODOS_OPS } from './todoDataOps'
import { TODOS_ARCH } from './todoDataArch'

// Barrel: merges all todo arrays into single array
export const TODOS: Todo[] = [...TODOS_FEATURES, ...TODOS_OPS, ...TODOS_ARCH]
