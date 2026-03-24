'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  CaretLeft, CaretRight, CaretDown, X,
  FolderOpen, Sliders, Plugs, Eye,
  ChartBar, PencilSimple, MagnifyingGlass, Compass, ClipboardText, Sparkle,
} from '@phosphor-icons/react'
import ParrotIcon from '@/components/ParrotIcon'
import type { Project } from '@/hooks/useWorkspaceState'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface Prefs {
  chat_style: 'clear' | 'structured' | 'detailed'
  memory_window: number
  proactive_hints: boolean
  thinking_mode: boolean
  link_previews: boolean
  web_search_enabled: boolean
}

export interface SessionPanelProps {
  conversationId: string | null
  activeConvProjectId: string | null
  projects: Project[]
  collapsed?: boolean
  onToggleCollapse?: () => void
}

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const STYLE_OPTIONS: Array<{ value: Prefs['chat_style']; label: string; desc: string }> = [
  { value: 'clear',      label: 'Klar',        desc: 'Kurz und direkt' },
  { value: 'structured', label: 'Strukturiert', desc: 'Mit Überschriften und Listen' },
  { value: 'detailed',   label: 'Ausführlich',  desc: 'Detailliert mit Beispielen' },
]
const STYLE_LABELS: Record<Prefs['chat_style'], string> = {
  clear: 'Klar', structured: 'Strukturiert', detailed: 'Ausführlich',
}

interface LibrarySkill {
  id: string
  name: string
  title: string
  icon: string | null
  description: string | null
}

const SKILL_ICONS: Record<string, React.ElementType> = {
  analyst:         ChartBar,
  writer:          PencilSimple,
  researcher:      MagnifyingGlass,
  strategist:      Compass,
  project_manager: ClipboardText,
}

function SkillIcon({ name, size = 12 }: { name: string; size?: number }) {
  const Icon = SKILL_ICONS[name.toLowerCase()] ?? Sparkle
  return <Icon size={size} weight="bold" />
}

const MCP_ITEMS = [
  { id: 'gdrive',   label: 'Google Drive', connected: false },
  { id: 'hubspot',  label: 'HubSpot',      connected: false },
  { id: 'slack',    label: 'Slack',        connected: false },
]

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="sp-section-label">
      {icon}
      <span>{children}</span>
    </div>
  )
}

function Divider() {
  return <div className="sp-divider" />
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export default function SessionPanel({
  conversationId: _convId,
  activeConvProjectId,
  projects,
  collapsed: collapsedProp,
  onToggleCollapse,
}: SessionPanelProps) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [collapsedInternal, setCollapsedInternal] = useState(false)
  const collapsed = collapsedProp === undefined ? collapsedInternal : collapsedProp
  function setCollapsed(v: boolean) {
    if (onToggleCollapse) { onToggleCollapse() } else { setCollapsedInternal(v) }
  }

  const [prefs, setPrefs] = useState<Prefs>({
    chat_style: 'structured',
    memory_window: 20,
    proactive_hints: true,
    thinking_mode: false,
    link_previews: true,
    web_search_enabled: false,
  })
  const [userId, setUserId] = useState<string | null>(null)
  const [styleDropOpen, setStyleDropOpen] = useState(false)
  const styleDropRef = useRef<HTMLDivElement>(null)
  const [skillDrawerOpen, setSkillDrawerOpen] = useState(false)
  const [librarySkills, setLibrarySkills] = useState<LibrarySkill[]>([])
  const [activeSkillIds, setActiveSkillIds] = useState<Set<string>>(new Set())
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [comingSoonMsg, setComingSoonMsg] = useState<string | null>(null)
  const comingSoonTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showComingSoon(label: string) {
    if (comingSoonTimer.current) clearTimeout(comingSoonTimer.current)
    setComingSoonMsg(`${label} — Integration kommt bald`)
    comingSoonTimer.current = setTimeout(() => setComingSoonMsg(null), 4000)
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase
        .from('user_preferences')
        .select('chat_style, memory_window, proactive_hints, thinking_mode, link_previews, web_search_enabled')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        setPrefs({
          chat_style: (data.chat_style as Prefs['chat_style']) ?? 'structured',
          memory_window: (data as { memory_window?: number }).memory_window ?? 20,
          proactive_hints: (data as { proactive_hints?: boolean }).proactive_hints ?? true,
          thinking_mode: (data as { thinking_mode?: boolean }).thinking_mode ?? false,
          link_previews: (data as { link_previews?: boolean }).link_previews ?? true,
          web_search_enabled: (data as { web_search_enabled?: boolean }).web_search_enabled ?? false,
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!styleDropOpen) return
    function onDown(e: MouseEvent) {
      if (styleDropRef.current && !styleDropRef.current.contains(e.target as Node)) {
        setStyleDropOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [styleDropOpen])

  const savePrefs = useCallback((partial: Partial<Prefs>) => {
    if (!userId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      supabase.from('user_preferences').update(partial).eq('user_id', userId)
    }, 500)
  }, [userId, supabase])

  function updatePref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs(prev => ({ ...prev, [key]: value }))
    savePrefs({ [key]: value })
  }

  async function openSkillDrawer() {
    setSkillDrawerOpen(true)
    if (librarySkills.length > 0) return
    setSkillsLoading(true)
    try {
      const res = await fetch('/api/library/skills')
      if (res.ok) {
        const data = await res.json() as { skills: LibrarySkill[] }
        setLibrarySkills(data.skills ?? [])
      }
    } catch {
      // silently ignore
    } finally {
      setSkillsLoading(false)
    }
  }

  function toggleSkill(id: string) {
    setActiveSkillIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activeProject = projects.find(p => p.id === activeConvProjectId) ?? null

  // ── Collapsed State ─────────────────────────────────────

  if (collapsed) {
    return (
      <div className="sp-collapsed">
        <button className="sp-collapse-btn" onClick={() => setCollapsed(false)} title="Panel öffnen">
          <CaretRight size={13} weight="bold" />
        </button>
        <div className="sp-parrot" title="Toro ist hier">
          <ParrotIcon size={20} />
        </div>
      </div>
    )
  }

  // ── Full Panel ──────────────────────────────────────────

  return (
    <div className="sp sidebar-scroll">

      {/* Header */}
      <div className="sp-header">
        <span className="sp-header-label">Chat</span>
        <button className="sp-header-btn" onClick={() => setCollapsed(true)} title="Panel einklappen">
          <CaretLeft size={14} weight="bold" />
        </button>
      </div>

      {/* ── KONTEXT ── */}
      <div className="sp-section">
        <SectionLabel icon={<FolderOpen size={10} weight="bold" />}>Kontext</SectionLabel>
        <div className="sp-context-row">
          <span className={`sp-context-dot${activeProject ? ' sp-context-dot--active' : ''}`} />
          {activeProject ? (
            <span className="sp-context-name">{activeProject.title}</span>
          ) : (
            <span className="sp-context-name" style={{ color: 'var(--text-tertiary)' }}>Freier Chat</span>
          )}
        </div>
      </div>

      <Divider />

      {/* ── TORO KONFIGURIEREN ── */}
      <div className="sp-section">
        <SectionLabel icon={<Sliders size={10} weight="bold" />}>Toro konfigurieren</SectionLabel>

        {/* Skills */}
        <div className="sp-field">
          <div className="sp-field-header">
            <label className="sp-select-label" style={{ margin: 0 }}>Skills</label>
            <button className="sp-skill-add" onClick={openSkillDrawer} title="Skills verwalten">
              + Hinzufügen
            </button>
          </div>
          <div className="sp-skill-chips">
            {activeSkillIds.size === 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Keine Skills aktiv</span>
            )}
            {librarySkills.filter(s => activeSkillIds.has(s.id)).map(skill => (
              <span key={skill.id} className="skill-chip-active">
                <SkillIcon name={skill.name} size={11} />
                {skill.title}
                <button
                  className="skill-chip-remove"
                  onClick={() => toggleSkill(skill.id)}
                  aria-label={`${skill.title} entfernen`}
                >
                  <X size={10} weight="bold" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Skill Drawer */}
        {skillDrawerOpen && (
          <>
            <div
              className="sp-drawer-backdrop"
              onClick={() => setSkillDrawerOpen(false)}
              aria-hidden="true"
            />
            <div className="sp-drawer">
              <div className="sp-drawer-header">
                <span className="sp-drawer-title">Skills</span>
                <button className="sp-drawer-close" onClick={() => setSkillDrawerOpen(false)} aria-label="Schließen">
                  <X size={14} weight="bold" />
                </button>
              </div>
              <div className="sp-drawer-body">
                {skillsLoading && <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Lädt…</span>}
                {!skillsLoading && librarySkills.map(skill => (
                  <div key={skill.id} className="sp-drawer-row">
                    <span className="sp-drawer-row-icon">
                      <SkillIcon name={skill.name} size={13} />
                    </span>
                    <div className="sp-drawer-row-info">
                      <span className="sp-drawer-row-title">{skill.title}</span>
                      {skill.description && (
                        <span className="sp-drawer-row-desc">{skill.description}</span>
                      )}
                    </div>
                    <button
                      className={`sp-drawer-row-btn${activeSkillIds.has(skill.id) ? ' sp-drawer-row-btn--active' : ''}`}
                      onClick={() => toggleSkill(skill.id)}
                    >
                      {activeSkillIds.has(skill.id) ? 'Entfernen' : 'Hinzufügen'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Gedächtnis-Slider */}
        <div className="sp-field">
          <div className="sp-slider-row">
            <label className="sp-slider-label">Gedächtnis</label>
            <span className="sp-slider-value">{prefs.memory_window} Nachr.</span>
          </div>
          <input
            type="range"
            min={5} max={50} step={5}
            value={prefs.memory_window}
            onChange={e => updatePref('memory_window', Number(e.target.value))}
            className="sp-slider"
          />
        </div>

        {/* Antwort-Stil */}
        <div className="sp-field">
          <label className="sp-select-label">Antwort-Stil</label>
          <div className="sp-select-wrap" ref={styleDropRef}>
            <button
              className="sp-select-trigger"
              onClick={() => setStyleDropOpen(v => !v)}
            >
              {STYLE_LABELS[prefs.chat_style]}
              <CaretDown
                size={14} weight="bold"
                style={{
                  color: 'var(--text-tertiary)',
                  flexShrink: 0,
                  transform: styleDropOpen ? 'rotate(180deg)' : undefined,
                  transition: 'transform 0.15s',
                }}
              />
            </button>
            {styleDropOpen && (
              <div className="sp-select-menu">
                {STYLE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`sp-select-option${prefs.chat_style === opt.value ? ' sp-select-option--active' : ''}`}
                    onClick={() => { updatePref('chat_style', opt.value); setStyleDropOpen(false) }}
                  >
                    <span className="sp-select-opt-label">{opt.label}</span>
                    <span className="sp-select-opt-desc">{opt.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Proaktive Hinweise */}
        <div className="sp-field">
          <div className="sp-toggle-row">
            <span className="sp-toggle-label">💡 Proaktive Hinweise</span>
            <button
              className={`sp-toggle-btn${prefs.proactive_hints ? ' sp-toggle-btn--on' : ''}`}
              onClick={() => updatePref('proactive_hints', !prefs.proactive_hints)}
              title={prefs.proactive_hints ? 'Deaktivieren' : 'Aktivieren'}
            >
              <span className={`sp-toggle-thumb${prefs.proactive_hints ? ' sp-toggle-thumb--on' : ''}`} />
            </button>
          </div>
          <p className="sp-toggle-note">Toro schlägt nächste Schritte vor.</p>
        </div>

        {/* Thinking Mode */}
        <div className="sp-field">
          <div className="sp-toggle-row">
            <span className="sp-toggle-label">Toro denkt laut nach</span>
            <button
              className={`sp-toggle-btn${prefs.thinking_mode ? ' sp-toggle-btn--on' : ''}`}
              onClick={() => updatePref('thinking_mode', !prefs.thinking_mode)}
              title={prefs.thinking_mode ? 'Deaktivieren' : 'Aktivieren'}
            >
              <span className={`sp-toggle-thumb${prefs.thinking_mode ? ' sp-toggle-thumb--on' : ''}`} />
            </button>
          </div>
          <p className="sp-toggle-note">Experimentell — zeigt Toros Denkprozess</p>
        </div>
      </div>

      <Divider />

      {/* ── VERBINDUNGEN (MCP) ── */}
      <div className="sp-section">
        <SectionLabel icon={<Plugs size={10} weight="bold" />}>Verbindungen</SectionLabel>
        {MCP_ITEMS.map(item => (
          <button
            key={item.id}
            className="sp-mcp-row sp-mcp-row--btn"
            onClick={() => !item.connected && showComingSoon(item.label)}
            title={item.connected ? undefined : `${item.label} verbinden`}
          >
            <span className={`sp-mcp-dot${item.connected ? ' sp-mcp-dot--on' : ''}`} />
            <span className="sp-mcp-label">{item.label}</span>
            <span className="sp-mcp-status">{item.connected ? 'verbunden' : 'nicht verbunden'}</span>
          </button>
        ))}
        {comingSoonMsg && (
          <div className="sp-coming-soon-toast">{comingSoonMsg}</div>
        )}
        <button className="sp-mcp-add" disabled title="Bald verfügbar">
          + Weitere verbinden →
        </button>
      </div>

      <Divider />

      {/* ── ANSICHT ── */}
      <div className="sp-section">
        <SectionLabel icon={<Eye size={10} weight="bold" />}>Ansicht</SectionLabel>

        {/* Split-View — Placeholder */}
        <div className="sp-field">
          <div className="sp-toggle-row">
            <span className="sp-toggle-label">Geteilter Bildschirm</span>
            <button className="btn btn-ghost btn-sm" disabled>Aktivieren</button>
          </div>
          <p className="sp-toggle-note">Chat links · Artefakt rechts</p>
        </div>

        {/* Live-Suche */}
        <div className="sp-field">
          <div className="sp-toggle-row">
            <span className="sp-toggle-label">Live-Suche</span>
            <button
              className={`sp-toggle-btn${prefs.web_search_enabled ? ' sp-toggle-btn--on' : ''}`}
              onClick={() => updatePref('web_search_enabled', !prefs.web_search_enabled)}
              title={prefs.web_search_enabled ? 'Deaktivieren' : 'Aktivieren'}
            >
              <span className={`sp-toggle-thumb${prefs.web_search_enabled ? ' sp-toggle-thumb--on' : ''}`} />
            </button>
          </div>
          <p className="sp-toggle-note">Toro sucht im Web nach aktuellen Infos</p>
        </div>

        {/* Link-Vorschauen */}
        <div className="sp-field">
          <div className="sp-toggle-row">
            <span className="sp-toggle-label">Links anzeigen</span>
            <button
              className={`sp-toggle-btn${prefs.link_previews ? ' sp-toggle-btn--on' : ''}`}
              onClick={() => updatePref('link_previews', !prefs.link_previews)}
              title={prefs.link_previews ? 'Deaktivieren' : 'Aktivieren'}
            >
              <span className={`sp-toggle-thumb${prefs.link_previews ? ' sp-toggle-thumb--on' : ''}`} />
            </button>
          </div>
          <p className="sp-toggle-note">URL-Vorschauen im Chat</p>
        </div>
      </div>

    </div>
  )
}
