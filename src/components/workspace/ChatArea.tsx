'use client'

import React from 'react'
import type { ChatAreaProps } from './ChatArea.types'
import { useChatAreaState } from '@/hooks/useChatAreaState'
import IntentionGate from './IntentionGate'
import FocusedFlow from './FocusedFlow'
import ChatInput from './ChatInput'
import ChatHeaderStrip from './ChatHeaderStrip'
import ArtifactsView from './ArtifactsView'
import ContextBar from './ContextBar'
import ChatContextStrip from './ChatContextStrip'
import ChatModals from './ChatModals'
import ChatStatusBar from './ChatStatusBar'
import ChatMessageList from './ChatMessageList'

export default function ChatArea({
  activeConvId,
  messages,
  input,
  sending,
  error,
  routing,
  messagesEndRef,
  userInitial,
  projects,
  workspaceId,
  organizationId,
  onNewConversation: _onNewConversation,
  onSetInput,
  onSendMessage,
  onSendDirect,
  onRegenerate,
  onAssignToProject,
  onRenameConversation,
  onDeleteConversation,
  contextPercent,
  activeConvProjectId,
  onRefreshMessages,
  showMemoryModal,
  onSetShowMemoryModal,
  conversations,
  shareModalConvId,
  onSetShareModalConvId,
  memoryExtracting = false,
  chips,
  setChips: _setChips,
  attachmentRef,
  pendingIntention: _pendingIntention,
  onSetPendingIntention,
  pendingCurrentProjectId: _pendingCurrentProjectId,
  onSetPendingCurrentProjectId,
  onGuidedAction,
  onGenerateImage,
  userName,
  isInSplitView = false,
  isSearching = false,
  contextStartIndex = 0,
  onContextReset,
  suggestionsEnabled = true,
  isMobile = false,
  searchDrawerOpen = false,
  onSearchDrawerClose,
  onOpenSearch,
  onOpenInNewTab: _onOpenInNewTab,
  canOpenNewTab = false,
  onOpenParallelTabs,
  onSendDirectToConv: _onSendDirectToConv,
  onSendDirectToNewConv,
  showHeaderTitle: _showHeaderTitle = true,
}: ChatAreaProps) {
  const {
    assistantName,
    bookmarkedIds,
    bookmarksDrawerOpen,
    setBookmarksDrawerOpen,
    headerRef,
    perspectiveMsg,
    artifactsView,
    setArtifactsView,
    artifactsViewItems,
    artifactsViewLoading,
    openArtifactsView,
    activeConv,
    isFocused,
    focusedProject,
    intentionChoice,
    setIntentionChoice,
    parallelConfirm,
    parallelLoading,
    handleParallelConfirm,
    handleChatSubmit,
    handleParallelDeny,
    handleBookmarkChange,
  } = useChatAreaState({
    activeConvId,
    input,
    workspaceId,
    canOpenNewTab,
    conversations,
    projects,
    onRefreshMessages,
    onSetInput,
    onSendMessage,
    onSendDirect,
    onOpenParallelTabs,
    onSendDirectToNewConv,
  })

  function renderInput(onSubmit: (e: React.FormEvent) => void) {
    return (
      <div className="carea-input-wrap">
        <div className="carea-input-inner">
          <ChatInput input={input} setInput={onSetInput} sending={sending} onSubmit={onSubmit}
            attachmentRef={attachmentRef}
          />
          <p className="chat-ai-disclaimer">
            {assistantName}s Antworten sind KI-generiert und können Fehler enthalten. Prüfe wichtige Informationen immer selbst.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="carea">
      {activeConvId ? (
        <>
          {!isMobile && (
            <ChatHeaderStrip
              ref={headerRef}
              conversationId={activeConvId}
              conversationTitle={activeConv?.title ?? null}
              projectId={activeConvProjectId}
              projects={projects}
              workspaceId={workspaceId}
              onOpenSearch={onOpenSearch}
              onRenameConversation={onRenameConversation}
              onAssignToProject={onAssignToProject}
              onDeleteConversation={onDeleteConversation}
              onSummarizeArtifacts={() => onSendDirect(
                'Bitte fasse unser gesamtes Gespräch als Dokument-Artefakt zusammen — mit den wichtigsten Themen, Erkenntnissen und Ergebnissen. Das Artefakt soll so aufbereitet sein, dass es eigenständig geteilt werden kann.'
              )}
              onShowArtifactsView={openArtifactsView}
            />
          )}

          {isFocused && focusedProject && (
            <ChatContextStrip
              projectName={focusedProject.title}
              workspaceId={workspaceId}
              driftDetected={activeConv?.drift_detected}
            />
          )}

          {activeConvId && <ContextBar percent={contextPercent} />}

          {artifactsView && (
            <ArtifactsView
              items={artifactsViewItems}
              loading={artifactsViewLoading}
              conversationId={activeConvId}
              organizationId={organizationId}
              onSendDirect={onSendDirect}
              onBack={() => setArtifactsView(false)}
            />
          )}

          <ChatMessageList
            messages={messages}
            contextStartIndex={contextStartIndex}
            userInitial={userInitial}
            conversationId={activeConvId}
            organizationId={organizationId}
            bookmarkedIds={bookmarkedIds}
            onBookmarkChange={handleBookmarkChange}
            headerRef={headerRef}
            onSendDirect={onSendDirect}
            sending={sending}
            chips={chips}
            onRegenerate={onRegenerate}
            onGuidedAction={onGuidedAction}
            onGenerateImage={onGenerateImage}
            isInSplitView={isInSplitView}
            suggestionsEnabled={suggestionsEnabled}
            parallelConfirm={parallelConfirm}
            parallelLoading={parallelLoading}
            onParallelConfirm={() => { void handleParallelConfirm() }}
            onParallelDeny={handleParallelDeny}
            contextPercent={contextPercent}
            onContextReset={onContextReset}
            error={error}
            messagesEndRef={messagesEndRef}
            artifactsView={artifactsView}
          />

          <ChatStatusBar
            isSearching={isSearching}
            routing={routing}
            memoryExtracting={memoryExtracting}
            perspectiveMsg={perspectiveMsg}
          />

          {renderInput(handleChatSubmit)}

          <ChatModals
            activeConvId={activeConvId}
            bookmarksDrawerOpen={bookmarksDrawerOpen}
            onBookmarksDrawerClose={() => setBookmarksDrawerOpen(false)}
            onUseBookmarkAsPrompt={(text) => { onSetInput(text); setBookmarksDrawerOpen(false) }}
            searchDrawerOpen={searchDrawerOpen}
            onSearchDrawerClose={() => onSearchDrawerClose?.()}
            workspaceId={workspaceId}
            showMemoryModal={showMemoryModal}
            onSetShowMemoryModal={onSetShowMemoryModal}
            activeConvProjectId={activeConvProjectId}
            shareModalConvId={shareModalConvId}
            conversations={conversations}
            onSetShareModalConvId={onSetShareModalConvId}
          />
        </>
      ) : intentionChoice === 'focused' ? (
        <FocusedFlow
          projects={projects}
          workspaceId={workspaceId ?? ''}
          input={input}
          setInput={onSetInput}
          sending={sending}
          onSubmit={onSendMessage}
          onSetPendingIntention={onSetPendingIntention}
          onSetPendingCurrentProjectId={onSetPendingCurrentProjectId}
        />
      ) : intentionChoice === 'guided' ? (
        <>
          <div className="carea-messages" aria-live="polite" aria-label="Chat-Verlauf" role="log">
            <div className="intention-guided-start">
              <p>Geführter Modus — {assistantName} stellt dir gezielte Fragen. Schreib einfach los.</p>
            </div>
          </div>
          {renderInput(handleChatSubmit)}
        </>
      ) : (
        <>
          <IntentionGate
            onFocused={() => setIntentionChoice('focused')}
            onGuided={() => {
              onSetPendingIntention('guided')
              setIntentionChoice('guided')
            }}
            userName={userName}
          />
          {renderInput(onSendMessage)}
        </>
      )}
    </div>
  )
}
