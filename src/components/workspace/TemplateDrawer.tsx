'use client'

import React, { useEffect, useState } from 'react'
import { X } from '@phosphor-icons/react'
import type { Template } from '@/lib/prompt-templates'

interface TemplateDrawerProps {
  template: Template | null
  onClose: () => void
  onAccept: (prompt: string) => void
}

export default function TemplateDrawer({ template, onClose, onAccept }: TemplateDrawerProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  // Reset values whenever the active template changes
  useEffect(() => {
    if (!template) return
    const initial: Record<string, string> = {}
    template.fields.forEach((f) => {
      initial[f.id] = f.type === 'select' && 'options' in f ? f.options[0] : ''
    })
    setValues(initial)
  }, [template?.id])

  if (!template) return null

  const requiredFilled = template.fields
    .filter((f) => !f.optional)
    .every((f) => (values[f.id] ?? '').trim().length > 0)

  const preview = requiredFilled ? template.assemble(values) : null

  function set(id: string, val: string) {
    setValues((prev) => ({ ...prev, [id]: val }))
  }

  return (
    <div className="tdrawer">
      <div className="tdrawer-header">
        <span className="tdrawer-title">{template.label}</span>
        <button className="tdrawer-close" onClick={onClose} title="Schließen">
          <X size={16} />
        </button>
      </div>

      <div className="tdrawer-fields">
        {template.fields.map((field) => (
          <div key={field.id} className="tdrawer-field">
            <label className="tdrawer-label">
              {field.label}
              {field.optional && <span className="tdrawer-optional">optional</span>}
            </label>

            {field.type === 'select' ? (
              <select
                className="tdrawer-select"
                value={values[field.id] ?? field.options[0]}
                onChange={(e) => set(field.id, e.target.value)}
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                className="tdrawer-textarea"
                placeholder={field.placeholder}
                value={values[field.id] ?? ''}
                onChange={(e) => set(field.id, e.target.value)}
                rows={5}
              />
            ) : (
              <input
                className="tdrawer-input"
                type="text"
                placeholder={field.placeholder}
                value={values[field.id] ?? ''}
                onChange={(e) => set(field.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {preview && (
        <div className="tdrawer-preview">
          <span className="tdrawer-preview-label">Vorschau</span>
          <p className="tdrawer-preview-text">{preview}</p>
        </div>
      )}

      <button
        className="tdrawer-accept"
        disabled={!requiredFilled}
        onClick={() => onAccept(template.assemble(values))}
      >
        Prompt übernehmen →
      </button>
    </div>
  )
}
