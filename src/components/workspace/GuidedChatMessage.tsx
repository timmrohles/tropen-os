'use client'

import type { ChatMessageType } from '@/hooks/useWorkspaceState'
import type { GuidedAction } from '@/lib/workspace-types'
import ParrotIcon from '@/components/ParrotIcon'
import GuidedModePicker from './GuidedModePicker'
import GuidedStepCard from './GuidedStepCard'
import GuidedSummary from './GuidedSummary'

export default function GuidedChatMessage({ msg, onGuidedAction }: {
  msg: ChatMessageType
  onGuidedAction: (action: GuidedAction) => void
}) {
  if (!msg.guidedData || !msg.id) return null
  const gd = msg.guidedData
  const msgId = msg.id
  return (
    <div className="cmsg cmsg--assistant">
      <div className="cmsg-avatar-toro"><ParrotIcon size={22} /></div>
      <div className="cmsg-bubble cmsg-bubble--assistant">
        <div className="cmsg-content">
          {msg.role === 'guided_picker' && (
            <GuidedModePicker onSelect={mode => onGuidedAction({ type: 'select_mode', messageId: msgId, mode })} />
          )}
          {msg.role === 'guided_step' && (
            <GuidedStepCard
              step={gd.steps[gd.currentStepIndex]}
              stepNumber={gd.currentStepIndex + 1}
              totalSteps={gd.steps.length}
              onAnswer={(value, label) => onGuidedAction({ type: 'answer_step', messageId: msgId, value, label })}
            />
          )}
          {msg.role === 'guided_summary' && (
            <GuidedSummary
              answers={gd.answers}
              onConfirm={() => onGuidedAction({ type: 'confirm_summary', messageId: msgId })}
              onEdit={stepIndex => onGuidedAction({ type: 'edit_step', messageId: msgId, stepIndex })}
            />
          )}
        </div>
      </div>
    </div>
  )
}
