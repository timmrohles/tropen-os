// TODO(timm): Vollständige Implementierung kommt mit Parallel-Tabs-Feature (stash: mega-refactor-april-8)
export interface ParallelIntent {
  count: number
  labels: string[]
}

export function detectParallelIntent(_input: string): ParallelIntent | null {
  return null
}
