'use client'

import { useEffect, useState } from 'react'
import { Speedometer, Plus } from '@phosphor-icons/react'
import { CockpitOnboarding } from '@/components/cockpit/CockpitOnboarding'
import { CockpitGrid } from '@/components/cockpit/CockpitGrid'
import { WidgetPickerModal } from '@/components/cockpit/WidgetPickerModal'
import type { WidgetMeta } from '@/lib/cockpit/widgetCatalog'

interface CockpitWidget {
  id: string
  widget_type: string
  position: number
  size: 'small' | 'medium' | 'large'
  config: Record<string, unknown>
  is_visible: boolean
}

interface WidgetsResponse {
  widgets: CockpitWidget[]
  setupDone: boolean
  isAdmin: boolean
}

function CockpitSkeleton() {
  return (
    <div className="cockpit-grid" aria-busy="true" aria-label="Cockpit wird geladen">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className={`cockpit-widget-slot cockpit-widget-slot--${i % 2 === 0 ? 'medium' : 'small'}`}
          style={{ opacity: 0.4, background: 'var(--bg-surface)' }}
        />
      ))}
    </div>
  )
}

export default function CockpitPage() {
  const [widgets, setWidgets] = useState<CockpitWidget[]>([])
  const [setupDone, setSetupDone] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  async function loadWidgets() {
    const res = await fetch('/api/cockpit/widgets')
    if (!res.ok) return
    const data: WidgetsResponse = await res.json()
    setWidgets(data.widgets)
    setSetupDone(data.setupDone)
    setIsAdmin(data.isAdmin)
    setLoading(false)
  }

  useEffect(() => { loadWidgets() }, [])

  async function handleSetupComplete(role: string) {
    setSaving(true)
    const res = await fetch('/api/cockpit/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      const { widgets: w } = await res.json()
      setWidgets(w)
      setSetupDone(true)
    }
    setSaving(false)
  }

  async function handleAddWidget(meta: WidgetMeta) {
    const res = await fetch('/api/cockpit/widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widget_type: meta.type }),
    })
    if (res.ok) {
      const { widget } = await res.json()
      setWidgets(prev => [...prev, widget])
    }
  }

  async function handleRemoveWidget(id: string) {
    // Optimistic update
    setWidgets(prev => prev.filter(w => w.id !== id))
    await fetch(`/api/cockpit/widgets/${id}`, { method: 'DELETE' })
  }

  const hasWidgets = widgets.length > 0
  const existingTypes = widgets.map(w => w.widget_type)

  return (
    <div className="content-max">
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">
            <Speedometer size={22} weight="fill" color="var(--text-primary)" aria-hidden="true" />
            Cockpit
          </h1>
        </div>
        {(setupDone || hasWidgets) && (
          <div className="page-header-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowPicker(true)}
              disabled={existingTypes.length >= 8}
            >
              <Plus size={14} weight="bold" aria-hidden="true" />
              Widget hinzufügen
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <CockpitSkeleton />
      ) : !setupDone && !hasWidgets ? (
        <CockpitOnboarding onComplete={handleSetupComplete} loading={saving} />
      ) : (
        <CockpitGrid
          widgets={widgets}
          onAddWidget={() => setShowPicker(true)}
          onRemoveWidget={handleRemoveWidget}
        />
      )}

      {showPicker && (
        <WidgetPickerModal
          existing={existingTypes}
          isAdmin={isAdmin}
          onAdd={handleAddWidget}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
