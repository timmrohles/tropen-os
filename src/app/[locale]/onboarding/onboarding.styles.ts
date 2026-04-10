import type React from 'react'

export const s: Record<string, React.CSSProperties> = {
  // ── Layout ───────────────────────────────────────────────
  page: {
    minHeight: 'calc(100vh - 52px)',
    background: 'var(--bg-surface-solid)',
    display: 'flex',
    flexDirection: 'column',
  },
  progressTrack: {
    height: 3,
    background: 'var(--border)',
    flexShrink: 0,
  },
  progressBar: {
    height: '100%',
    background: 'var(--accent)',
    transition: 'width 0.4s ease',
  },
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 24px 80px',
    overflowY: 'auto',
  },
  step: {
    width: '100%',
    maxWidth: 560,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },

  // ── Typography ───────────────────────────────────────────
  stepLabel: { fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 },
  h1: { fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 8, margin: '0 0 10px' },
  sub: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32, margin: '0 0 32px' },
  label: { display: 'block', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
  hint: { display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.5 },
  error: { fontSize: 13, color: '#ef4444', background: '#1f0a0a', padding: '10px 14px', borderRadius: 6, marginTop: 8 },

  // ── Form ─────────────────────────────────────────────────
  field: { display: 'flex', flexDirection: 'column', marginBottom: 24 },
  input: {
    background: 'var(--bg-surface-solid)',
    border: '1px solid var(--border-medium)',
    color: 'var(--text-primary)',
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 15,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },

  // ── Logo Drop Zone ────────────────────────────────────────
  dropZone: {
    border: '1px dashed var(--border-medium)',
    borderRadius: 10,
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    background: 'var(--bg-surface)',
    transition: 'border-color 0.15s, background 0.15s',
    minHeight: 100,
  },
  dropZoneActive: { borderColor: 'var(--accent)', background: 'var(--accent-subtle)' },
  dropZoneHasLogo: { borderColor: 'var(--border-medium)', padding: '16px', background: 'var(--bg-surface)' },
  logoPreview: { maxHeight: 64, maxWidth: '100%', objectFit: 'contain' },
  dropHint: { fontSize: 13, color: 'var(--text-secondary)' },
  dropSub: { fontSize: 11, color: 'var(--text-tertiary)' },

  // ── Color Picker ─────────────────────────────────────────
  colorRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 },
  colorSwatch: {
    width: 30, height: 30, borderRadius: '50%', border: '2px solid transparent',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.1s, box-shadow 0.1s',
  },
  colorSwatchActive: { border: '2px solid #fff', transform: 'scale(1.15)', boxShadow: '0 0 0 2px rgba(255,255,255,0.15)' },
  colorInput: { width: 30, height: 30, borderRadius: 4, border: 'none', cursor: 'pointer', background: 'none', padding: 0 },
  colorPreviewBar: {
    height: 6, borderRadius: 3, transition: 'background 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    padding: '0 8px',
  },

  // ── Cards ────────────────────────────────────────────────
  cardRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  card: {
    flex: '1 1 140px', minWidth: 130,
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '18px 14px',
    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6,
    textAlign: 'left', transition: 'border-color 0.15s, background 0.15s',
  },
  cardActive: { background: 'var(--accent-light)', border: '1px solid var(--accent)' },
  cardEmoji: { fontSize: 24 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  cardSub: { fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 },

  // ── Chips ────────────────────────────────────────────────
  chipRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  chip: {
    fontSize: 12, padding: '8px 14px', borderRadius: 20,
    border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)',
    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
  },
  chipActive: { background: 'var(--accent)', border: '1px solid var(--accent)', color: '#fff', fontWeight: 600 },

  // ── Done Screen ──────────────────────────────────────────
  featureRow: { display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' },
  featureCard: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10,
    padding: '16px 14px', flex: '1 1 120px', maxWidth: 160,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  },
  featureTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  featureSub: { fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' },

  // ── Buttons ──────────────────────────────────────────────
  btnRow: { display: 'flex', gap: 10, marginTop: 24 },
  btnPrimary: {
    background: 'var(--accent)', color: '#fff', border: 'none',
    padding: '13px 28px', borderRadius: 8, cursor: 'pointer',
    fontSize: 15, fontWeight: 700, marginTop: 24,
    transition: 'opacity 0.15s',
  },
  btnDisabled: { opacity: 0.4, cursor: 'not-allowed' },

  // ── AI Act ────────────────────────────────────────────────
  aiActPara: {
    fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75,
    margin: '0 0 16px',
  },
  checkboxLabel: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: '16px 18px', background: 'var(--bg-surface)',
    border: '1px solid var(--border)', borderRadius: 8,
    cursor: 'pointer', marginBottom: 24,
  },
  checkbox: {
    width: 17, height: 17, marginTop: 2, flexShrink: 0,
    accentColor: 'var(--accent)', cursor: 'pointer',
  },
  checkboxText: { fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 },
  academyCard: {
    background: 'var(--bg-surface)',
    borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)',
    borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: 'var(--accent)',
    borderRadius: 8, padding: '18px 20px', marginBottom: 20,
  },
  academyTitle: { fontSize: 14, fontWeight: 600, color: '#b0b0b0' },
  academyText: { fontSize: 13, color: '#666', lineHeight: 1.65, margin: '0 0 8px' },
  academyLink: {
    fontSize: 13, color: 'var(--accent)', textDecoration: 'none',
    fontWeight: 500, display: 'inline-block',
  },
  accordionWrap: { marginBottom: 8 },
  accordionBtn: {
    background: 'none', border: 'none', color: '#555',
    fontSize: 13, cursor: 'pointer', padding: 0,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  accordionBody: {
    marginTop: 10, padding: '12px 14px',
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 6, fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.7,
  },
}
