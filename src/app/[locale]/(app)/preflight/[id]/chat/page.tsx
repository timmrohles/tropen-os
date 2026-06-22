import { ChatCircle } from '@phosphor-icons/react/dist/ssr'
import { PreflightChat } from './_components/PreflightChat'

export default async function PreflightChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <ChatCircle size={30} color="var(--text-primary)" weight="fill" aria-hidden="true" />
            Pre-Flight Chat
          </h1>
          <p className="page-header-sub">Schärfe deine Idee gemeinsam mit Toro.</p>
        </div>
      </div>

      <PreflightChat projectId={id} />
    </div>
  )
}
