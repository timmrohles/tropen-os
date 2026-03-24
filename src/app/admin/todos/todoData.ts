import type { Todo } from './todo.types'
import { TODOS_FEATURES } from './todoDataFeatures'
import { TODOS_OPS } from './todoDataOps'
import { TODOS_ARCH } from './todoDataArch'
import { TODOS_CONCEPTS } from './todoDataConcepts'

// Barrel: merges all todo arrays into single array
// TODOS_CONCEPTS = Single Source of Truth für docs/product/roadmap.md → "Geplant (später)"
// Neue Roadmap-Einträge in todoDataConcepts.ts pflegen — erscheint automatisch hier
export const TODOS: Todo[] = [...TODOS_FEATURES, ...TODOS_OPS, ...TODOS_ARCH, ...TODOS_CONCEPTS]
