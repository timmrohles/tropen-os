'use client'

// ComplianceBlock — Sprint 6b₁ (ADR-027)
// Zeigt persistierte Compliance-Fragen für DSGVO und KI-Act.
// Coach-Position: Hinweise-Sektion (📋), Begrenzungs-Aussage explizit (Marken-Brief 28.1+28.3).
// Fragen 1:1 aus DsgvoTab/KiActTab — gleiche questionKeys, damit gespeicherte Antworten erhalten bleiben.

import React, { useState } from 'react'
import { ClipboardText } from '@phosphor-icons/react'
import { ComplianceQuestion } from './ComplianceQuestion'

// ── Fragen-Definitionen ────────────────────────────────────────────────────────

interface QuestionDef {
  key: string
  question: string
  type: 'boolean' | 'select'
  options?: string[]
  hint?: string
}

// Sprint 9c (ADR-027 Schritt 9) — Fragen-Wording geschärft basierend auf Komitee-8a-Sprachmustern.
// questionKey NICHT geändert — Antwort-Persistenz erhalten (DB-Schlüssel).

const DSGVO_QUESTIONS: QuestionDef[] = [
  {
    key: 'has_avv_supabase',
    question: 'Habt ihr einen Auftragsverarbeitungs-Vertrag (AVV) mit Supabase unterzeichnet?',
    type: 'boolean',
    hint: 'Art. 28 DSGVO — Pflicht wenn Supabase eure Daten verarbeitet. Supabase bietet einen Standard-AVV per Self-Service: app.supabase.com → Organisation → Legal → DPA.',
  },
  {
    key: 'has_avv_vercel',
    question: 'Habt ihr einen Auftragsverarbeitungs-Vertrag (AVV) mit Vercel unterzeichnet?',
    type: 'boolean',
    hint: 'Art. 28 DSGVO — Vercel bietet einen DPA (Data Processing Addendum) auf Anfrage: vercel.com/legal/dpa.',
  },
  {
    key: 'has_privacy_policy',
    question: 'Ist eure Datenschutzerklärung aktuell und für eure App passend?',
    type: 'boolean',
    hint: 'Art. 13/14 DSGVO — Informationspflicht. Wichtig: alle eingesetzten Drittanbieter müssen genannt sein (Supabase, Vercel, Analytics etc.). Wir prüfen nicht den Inhalt — nur dass ihr eine habt.',
  },
  {
    key: 'data_location',
    question: 'Wo werden eure Nutzerdaten gespeichert?',
    type: 'select',
    options: [
      'EU oder EWR',
      'USA mit Standardvertragsklauseln (SCC)',
      'USA ohne SCC — DSGVO-kritisch',
      'Andere Länder',
      'Weiß ich nicht',
    ],
    hint: 'Schrems-II: US-Server ohne Standard-Vertragsklauseln kann DSGVO-Verstoß sein. Supabase Frankfurt = EU. Vercel-Functions: Region in Settings wählbar.',
  },
  {
    key: 'has_deletion_process',
    question: 'Können eure Nutzer ihren Account vollständig löschen — Daten und alles?',
    type: 'boolean',
    hint: 'Art. 17 DSGVO — Recht auf Vergessenwerden. Nicht nur "deaktivieren": alle Daten müssen löschbar sein, inkl. Backups (mit ggf. zeitlicher Frist). Löschung muss technisch erzwingbar sein.',
  },
]

const KI_ACT_QUESTIONS: QuestionDef[] = [
  {
    key: 'ki_risk_class',
    question: 'Welche Risikoklasse hat eure KI nach dem EU AI Act?',
    type: 'select',
    options: [
      'Minimal — z.B. KI-Spam-Filter, Empfehlungs-Algorithmus',
      'Begrenzt — z.B. Chatbot, KI-generierte Texte/Bilder',
      'Hoch — z.B. Bewerbungs-Filter, Kredit-Scoring, Rechts-Beratung',
      'Unakzeptabel — verboten (Social Scoring, Manipulation)',
      'Noch nicht bestimmt',
    ],
    hint: 'EU AI Act Art. 6 — Bei Unsicherheit: Art. 6 listet konkrete Hochrisiko-Anwendungen. Für Hochrisiko-KI braucht ihr einen KI-Rechtsexperten zur Konformitätsbewertung.',
  },
  {
    key: 'ki_transparency_label',
    question: 'Erkennen eure Nutzer, wenn sie KI-generierte Inhalte sehen?',
    type: 'boolean',
    hint: 'Art. 50 EU AI Act — Chatbots und KI-generierte Inhalte müssen erkennbar sein. Visuelles Label "KI-generiert" direkt beim Inhalt, nicht nur im Footer.',
  },
  {
    key: 'ki_logging_enabled',
    question: 'Loggt ihr KI-Entscheidungen so, dass ihr sie später erklären könnt?',
    type: 'boolean',
    hint: 'Art. 12 EU AI Act — für begrenzte und höhere Risikoklassen Pflicht. Logging sollte Modell-ID, Zeitstempel, Input-Typ und Entscheidungs-Typ enthalten.',
  },
  {
    key: 'ki_purpose_documented',
    question: 'Habt ihr schriftlich festgehalten, wofür eure KI da ist — und was sie nicht tun soll?',
    type: 'boolean',
    hint: 'Art. 13 EU AI Act — Nutzer müssen wissen wofür KI eingesetzt wird. "Zweck + Grenzen" dokumentieren: was tut die KI, was tut sie nicht, wer ist verantwortlich.',
  },
]

// ── Config pro Domain ──────────────────────────────────────────────────────────

type ComplianceDomain = 'dsgvo' | 'ki-act'

const BLOCK_CONFIG: Record<ComplianceDomain, {
  title: string
  coachNote: string
  questions: QuestionDef[]
  borderColor: string
}> = {
  'dsgvo': {
    title: 'DSGVO — Stamm-Daten',
    coachNote: 'Diese Fragen können wir aus eurem Code nicht beantworten — wir fragen euch. Eure Antworten werden gespeichert und beim nächsten Audit berücksichtigt. Eine DSGVO-konforme Lösung braucht mehr als nur diese Antworten — bei Unsicherheit fragt einen Datenschutz-Experten.',
    questions: DSGVO_QUESTIONS,
    borderColor: 'var(--border)',
  },
  'ki-act': {
    title: 'EU AI Act — Selbst-Auskunft',
    coachNote: 'Wenn eure App KI nutzt, gelten ab 2026 zusätzliche Pflichten — wir prüfen das nicht aus dem Code, ihr klärt das selbst. Bei Hochrisiko-KI braucht ihr einen KI-Rechtsexperten — wir können die Einstufung nicht für euch machen. Eure Antworten werden gespeichert.',
    questions: KI_ACT_QUESTIONS,
    borderColor: 'var(--border)',
  },
}

// ── Komponente ─────────────────────────────────────────────────────────────────

interface ComplianceBlockProps {
  domain: ComplianceDomain
  projectId: string | null
  initialData?: Record<string, unknown>
  id?: string  // Scroll-Anchor-ID für Mini-Status-Links
}

export function ComplianceBlock({ domain, projectId, initialData = {}, id }: ComplianceBlockProps) {
  const [open, setOpen] = useState(false)
  const cfg = BLOCK_CONFIG[domain]

  const answeredCount = cfg.questions.filter(q => initialData[q.key] !== undefined && initialData[q.key] !== null).length

  return (
    <div
      id={id}
      style={{
        border: '1px solid var(--border)',
        borderRadius: 8, overflow: 'hidden', marginTop: 0,
        background: '#ffffff',
      }}>
      {/* Header — klickbar zum Aufklappen */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '9px 14px', background: 'var(--accent-light)', border: 'none', cursor: 'pointer',
          textAlign: 'left', borderBottom: open ? `1px solid ${cfg.borderColor}` : 'none',
        }}
      >
        <ClipboardText size={14} weight="fill" color="var(--text-tertiary)" aria-hidden="true" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
          {cfg.title}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>
          · {answeredCount}/{cfg.questions.length} beantwortet
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <>
          {/* Begrenzungs-Aussage (Marken-Brief 28.1) */}
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${cfg.borderColor}` }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
              {cfg.coachNote}
            </p>
          </div>
          {/* Fragen */}
          {cfg.questions.map(q => (
            <ComplianceQuestion
              key={q.key}
              projectId={projectId}
              questionKey={q.key}
              question={q.question}
              type={q.type}
              options={q.options}
              hint={q.hint}
              initialValue={initialData[q.key]}
            />
          ))}
        </>
      )}
    </div>
  )
}
