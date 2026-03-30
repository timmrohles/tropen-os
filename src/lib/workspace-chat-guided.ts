import type React from 'react'
import type { ChatMessage, GuidedAction, GuidedData } from './workspace-types'

export interface GuidedActionsCtx {
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  doSend: (currentInput: string) => Promise<void>
  doSendWithConvId: (currentInput: string, convId: string) => Promise<void>
}

export function handleGuidedAction(ctx: GuidedActionsCtx, action: GuidedAction) {
  const { messages, setMessages, doSend, doSendWithConvId } = ctx

  const msg = messages.find(m => m.id === action.messageId)
  if (!msg?.guidedData) return
  const gd: GuidedData = msg.guidedData

  if (action.type === 'select_mode') {
    if (action.mode === 'guided') {
      // Replace picker with first step
      setMessages(prev => prev.map(m =>
        m.id === action.messageId
          ? {
              ...m, id: crypto.randomUUID(), role: 'guided_step',
              guidedData: { ...gd, type: 'step', currentStepIndex: 0 },
            }
          : m
      ))
    } else {
      // Direkt / Offen — remove picker, send immediately
      setMessages(prev => prev.filter(m => m.id !== action.messageId))
      void doSendWithConvId(gd.originalMessage, gd.convId)
    }
    return
  }

  if (action.type === 'answer_step') {
    const idx = gd.currentStepIndex
    const newAnswers = [
      ...gd.answers,
      { stepId: gd.steps[idx].id, question: gd.steps[idx].question, answer: action.label },
    ]
    const nextIdx = idx + 1

    if (nextIdx >= gd.steps.length) {
      // All steps answered — show summary
      setMessages(prev => prev.map(m =>
        m.id === action.messageId
          ? {
              ...m, id: crypto.randomUUID(), role: 'guided_summary',
              guidedData: { ...gd, type: 'summary', currentStepIndex: nextIdx, answers: newAnswers },
            }
          : m
      ))
    } else {
      // Next step
      setMessages(prev => prev.map(m =>
        m.id === action.messageId
          ? {
              ...m, id: crypto.randomUUID(), role: 'guided_step',
              guidedData: { ...gd, type: 'step', currentStepIndex: nextIdx, answers: newAnswers },
            }
          : m
      ))
    }
    return
  }

  if (action.type === 'confirm_summary') {
    const contextLines = gd.answers.map(a => `${a.question}: ${a.answer}`).join('\n')
    const enrichedMessage = `${gd.originalMessage}\n\n[Kontext]\n${contextLines}`
    setMessages(prev => prev.filter(m => m.id !== action.messageId))
    void doSendWithConvId(enrichedMessage, gd.convId)
    return
  }

  if (action.type === 'edit_step') {
    const trimmedAnswers = gd.answers.slice(0, action.stepIndex)
    setMessages(prev => prev.map(m =>
      m.id === action.messageId
        ? {
            ...m, id: crypto.randomUUID(), role: 'guided_step',
            guidedData: { ...gd, type: 'step', currentStepIndex: action.stepIndex, answers: trimmedAnswers },
          }
        : m
    ))
  }
}
