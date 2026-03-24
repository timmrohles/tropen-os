'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Microphone, MicrophoneSlash, PaperPlaneRight, Paperclip, X } from '@phosphor-icons/react'
import type { AttachmentData, AttachmentMediaType } from '@/lib/workspace-types'

interface ChatInputProps {
  input: string
  setInput: (v: string) => void
  sending: boolean
  onSubmit: (e: React.FormEvent) => void
  attachmentRef?: React.MutableRefObject<AttachmentData | null>
}

// Web Speech API types (not in standard lib)
type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void
  onerror: () => void
  onend: () => void
  start: () => void
  stop: () => void
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null
}

const ALLOWED_TYPES: AttachmentMediaType[] = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
]
const MAX_SIZE_KB = 4096  // 4 MB — Anthropic base64 limit per image/doc

function isAllowedType(type: string): type is AttachmentMediaType {
  return ALLOWED_TYPES.includes(type as AttachmentMediaType)
}

export default function ChatInput({ input, setInput, sending, onSubmit, attachmentRef }: ChatInputProps) {
  const [recording, setRecording] = useState(false)
  const [hasSpeech, setHasSpeech] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachment, setAttachment] = useState<{ name: string; sizeKb: number; isImage: boolean } | null>(null)
  const [attachError, setAttachError] = useState<string | null>(null)

  useEffect(() => {
    setHasSpeech(!!getSpeechRecognition())
  }, [])

  const toggleRecording = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) return

    if (recording) {
      recognitionRef.current?.stop()
      return
    }

    const rec = new SR()
    rec.lang = 'de-DE'
    rec.continuous = false
    rec.interimResults = false

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput((input ? input + ' ' : '') + transcript)
    }
    rec.onerror = () => setRecording(false)
    rec.onend = () => setRecording(false)

    recognitionRef.current = rec
    rec.start()
    setRecording(true)
  }, [recording, input, setInput])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAttachError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!isAllowedType(file.type)) {
      setAttachError('Nur JPEG, PNG, GIF, WebP oder PDF erlaubt')
      e.target.value = ''
      return
    }

    const sizeKb = Math.round(file.size / 1024)
    if (sizeKb > MAX_SIZE_KB) {
      setAttachError(`Datei zu groß (max. 4 MB, diese: ${sizeKb} KB)`)
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      // strip "data:...;base64," prefix
      const base64 = dataUrl.split(',')[1] ?? ''
      const data: AttachmentData = {
        name: file.name,
        mediaType: file.type as AttachmentMediaType,
        base64,
        sizeKb,
      }
      if (attachmentRef) attachmentRef.current = data
      setAttachment({ name: file.name, sizeKb, isImage: file.type.startsWith('image/') })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function clearAttachment() {
    if (attachmentRef) attachmentRef.current = null
    setAttachment(null)
    setAttachError(null)
  }

  const hasAttachment = !!attachmentRef

  return (
    <div className="cinput-wrap-outer">
      {/* Attachment preview */}
      {attachment && (
        <div className="cinput-attachment">
          <span className="cinput-attachment-icon">{attachment.isImage ? '🖼' : '📄'}</span>
          <span className="cinput-attachment-name">{attachment.name}</span>
          <span className="cinput-attachment-size">{attachment.sizeKb} KB</span>
          <button
            type="button"
            className="cinput-attachment-clear"
            onClick={clearAttachment}
            aria-label="Anhang entfernen"
          >
            <X size={12} weight="bold" />
          </button>
        </div>
      )}
      {attachError && (
        <div className="cinput-attach-error">{attachError}</div>
      )}

      <form onSubmit={onSubmit} className="cinput-row">
        {/* Hidden file input */}
        {hasAttachment && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        )}

        {/* Paperclip button */}
        {hasAttachment && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`cinput-attach-btn${attachment ? ' cinput-attach-btn--active' : ''}`}
            aria-label="Datei anhängen"
            title="PDF oder Bild anhängen (einmalige Analyse)"
            disabled={sending}
          >
            <Paperclip size={17} weight="bold" />
          </button>
        )}

        {hasSpeech && (
          <button
            type="button"
            onClick={toggleRecording}
            className={`cinput-mic${recording ? ' cinput-mic--active' : ''}`}
            aria-label={recording ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
            title={recording ? 'Aufnahme stoppen' : 'Spracheingabe'}
          >
            {recording
              ? <MicrophoneSlash size={18} weight="fill" />
              : <Microphone size={18} weight="bold" />
            }
          </button>
        )}
        <input
          className="cinput-field"
          placeholder="Nachricht eingeben…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          autoFocus
        />
        <button
          className="cinput-send"
          type="submit"
          disabled={sending || (!input.trim() && !attachment)}
          aria-label={sending ? 'Nachricht wird gesendet…' : 'Nachricht senden'}
        >
          {sending
            ? <span className="cinput-sending">…</span>
            : <PaperPlaneRight size={20} weight="fill" />
          }
        </button>
      </form>
    </div>
  )
}
