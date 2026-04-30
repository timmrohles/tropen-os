/* eslint-disable unicorn/filename-case */
import { useState, useRef, useCallback } from 'react'

export type TTSState = 'idle' | 'loading' | 'playing' | 'error'

export function useTTS() {
  const [state, setState] = useState<TTSState>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stateRef = useRef<TTSState>('idle')

  const setTTSState = useCallback((s: TTSState) => {
    stateRef.current = s
    setState(s)
  }, [])

  const speak = useCallback(async (text: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    // Toggle: if playing, stop
    if (stateRef.current === 'playing') {
      setTTSState('idle')
      return
    }

    setTTSState('loading')

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'nova' }),
      })

      if (!response.ok) throw new Error('TTS fehlgeschlagen')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onplay = () => setTTSState('playing')
      audio.onended = () => {
        setTTSState('idle')
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        setTTSState('error')
        URL.revokeObjectURL(url)
      }

      await audio.play()
    } catch {
      setTTSState('error')
    }
  }, [setTTSState])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setTTSState('idle')
  }, [setTTSState])

  return { state, speak, stop }
}
