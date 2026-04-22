'use client'

// Stub — full implementation in mega-refactor-april-8 stash
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
