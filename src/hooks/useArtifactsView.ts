'use client'

// TODO(timm): Vollständige Implementierung kommt mit Artefakte-Feature (stash: mega-refactor-april-8)
interface ArtifactItem {
  id: string
  type: string
  name: string
  language: string | null
  content: string
}

export function useArtifactsView(_convId: string | null) {
  return {
    artifactsView: false,
    setArtifactsView: (_v: boolean): void => {},
    artifactsViewItems: [] as ArtifactItem[],
    artifactsViewLoading: false,
    openArtifactsView: (): void => {},
  }
}
