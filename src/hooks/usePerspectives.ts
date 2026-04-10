'use client'

// TODO(timm): Vollständige Implementierung kommt mit Perspectives-Feature (stash: mega-refactor-april-8)
export interface PerspectiveAvatar {
  id: string
  name: string
  emoji?: string
}

export interface PerspectiveMsg {
  avatarEmoji: string
  avatarName: string
  text: string
  done: boolean
}

export function usePerspectives(_convId: string | null, _onRefresh: () => void) {
  return {
    avatarCache: null as PerspectiveAvatar[] | null,
    perspectiveMsg: null as PerspectiveMsg | null,
    loadAvatars: async (): Promise<PerspectiveAvatar[]> => [],
    startPerspective: async (_avatar: PerspectiveAvatar, _afterMention?: string): Promise<void> => {},
  }
}
