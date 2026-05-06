// src/lib/audit/compliance-resolver.ts
// Compliance-Resolver Stufe 1 — implementiert 2026-05-06
// Komitee-Entscheidung: confirmed/needs-attention/input-needed/not-applicable
// Verboten: 'fulfilled' (juristisch untragbar ohne externe Verifikation)
//
// Stufe 1: 3 Checks aktiv — has_privacy_policy, has_deletion_process, data_location
// User-Vorrang total: Code-Signals sind Hinweise, nie Beweise.
// Disclaimer "Wir sind kein Anwalt" in jedem fixHint bei DSGVO-Findings.

import type { AuditContext, Finding, ComplianceAnswers } from './types'

// ─── Status-Typen ────────────────────────────────────────────────────────────

/**
 * Status-Typen — KEIN 'fulfilled' (Komitee-Konsens 2026-05-06: juristisch untragbar).
 * confirmed    = User hat bestätigt; wir haben es zur Kenntnis genommen
 * needs-attention = Problem erkannt (User sagt nein ODER Code-Signal negativ)
 * input-needed  = Keine User-Antwort, können nicht prüfen
 * not-applicable = Technologie nicht relevant oder nie anwendbar
 */
export type ComplianceStatus = 'confirmed' | 'needs-attention' | 'input-needed' | 'not-applicable'

export interface ComplianceCheckResult {
  questionKey: string
  status: ComplianceStatus
  finding?: {
    message: string
    severity: 'high' | 'medium'
    fixHint: string
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalize filePaths: lowercase, forward-slashes */
function normalizePath(p: string): string {
  return p.toLowerCase().replace(/\\/g, '/')
}

// ─── Check 1: has_privacy_policy ─────────────────────────────────────────────

/**
 * Prüft ob eine Datenschutzseite im Code vorhanden ist.
 * Code-Prüfbarkeit: JA (als Hinweis, nicht als Beweis).
 * User-Vorrang: Code-Signal führt zu input-needed (nicht confirmed).
 * Komitee-Konsens: kein 'confirmed' ohne inhaltliche Verifikation.
 */
function checkPrivacyPolicy(ctx: AuditContext, userAnswer: boolean | undefined): ComplianceCheckResult {
  const key = 'has_privacy_policy'

  if (userAnswer === true) {
    return { questionKey: key, status: 'confirmed' }
  }

  if (userAnswer === false) {
    return {
      questionKey: key,
      status: 'needs-attention',
      finding: {
        message: 'Datenschutzerklärung vom User als fehlend bestätigt (DSGVO Art. 13/14)',
        severity: 'high',
        fixHint: 'Datenschutzerklärung erstellen und verlinken. Wir sind kein Anwalt — für rechtssichere Formulierung einen Datenschutz-Experten einschalten.',
      },
    }
  }

  // userAnswer === undefined: Code-Check als Hint
  const privacyRoutePatterns = ['datenschutz', 'privacy']
  const hasCodeHint = ctx.filePaths.some((p) => {
    const normalized = normalizePath(p)
    return privacyRoutePatterns.some((pattern) => normalized.includes(pattern))
  })

  if (hasCodeHint) {
    return {
      questionKey: key,
      status: 'input-needed',
      finding: {
        message: 'Mögliche Datenschutzseite im Code erkannt — Aktualität und Vollständigkeit unbekannt (DSGVO Art. 13/14)',
        severity: 'medium',
        fixHint: 'Wir sehen einen möglichen Code-Hinweis, können aber nicht prüfen ob die Seite vollständig ist. Bitte beantworte die DSGVO-Frage.',
      },
    }
  }

  return {
    questionKey: key,
    status: 'input-needed',
    finding: {
      message: 'Datenschutzerklärung aus dem Code nicht erkennbar (DSGVO Art. 13/14)',
      severity: 'medium',
      fixHint: 'Aus dem Code nicht erkennbar. Bitte beantworte die DSGVO-Frage in den Compliance-Stamm-Daten.',
    },
  }
}

// ─── Check 2: has_deletion_process ───────────────────────────────────────────

/**
 * Prüft ob ein Konto-Löschprozess vorhanden ist.
 * Code-Prüfbarkeit: JA (als Hinweis, nicht als Beweis).
 * User-Vorrang: Code-Signal führt zu input-needed (nicht confirmed).
 */
function checkDeletionProcess(ctx: AuditContext, userAnswer: boolean | undefined): ComplianceCheckResult {
  const key = 'has_deletion_process'

  if (userAnswer === true) {
    return { questionKey: key, status: 'confirmed' }
  }

  if (userAnswer === false) {
    return {
      questionKey: key,
      status: 'needs-attention',
      finding: {
        message: 'Kein Löschprozess bestätigt (DSGVO Art. 17 — Recht auf Löschung)',
        severity: 'high',
        fixHint: 'DSGVO Art. 17 verlangt das Recht auf Löschung. Konto-Löschfunktion implementieren. Wir sind kein Anwalt.',
      },
    }
  }

  // userAnswer === undefined: Code-Check als Hint
  const deletionPatterns = ['delete', 'losch', 'konto']
  const hasCodeHint = ctx.filePaths.some((p) => {
    const normalized = normalizePath(p)
    return deletionPatterns.some((pattern) => normalized.includes(pattern))
  })

  if (hasCodeHint) {
    return {
      questionKey: key,
      status: 'input-needed',
      finding: {
        message: 'Möglicher Lösch-Code erkannt — Vollständigkeit des Löschprozesses unbekannt (DSGVO Art. 17)',
        severity: 'medium',
        fixHint: 'Löschwerkzeug im Code gefunden — aber löscht es wirklich alle Daten inkl. Backups und Drittanbieter? Bitte bestätigen.',
      },
    }
  }

  return {
    questionKey: key,
    status: 'input-needed',
    finding: {
      message: 'Konto-Löschprozess aus dem Code nicht erkennbar (DSGVO Art. 17)',
      severity: 'medium',
      fixHint: 'Bitte bestätige ob ein Konto-Löschprozess existiert.',
    },
  }
}

// ─── Check 3: data_location ──────────────────────────────────────────────────

/**
 * Prüft wo Produktionsdaten gespeichert werden.
 * Code-Prüfbarkeit: HYBRID — begrenzte Aussagekraft.
 * User-Vorrang: Production-Konfiguration ist nur dem User bekannt.
 * Komitee-Konsens: kein 'confirmed' ohne User-Bestätigung.
 */
function checkDataLocation(userAnswer: string | undefined): ComplianceCheckResult {
  const key = 'data_location'

  if (userAnswer === 'EU oder EWR') {
    return { questionKey: key, status: 'confirmed' }
  }

  if (userAnswer === 'USA ohne SCC') {
    return {
      questionKey: key,
      status: 'needs-attention',
      finding: {
        message: 'Daten-Speicherort USA ohne SCC — nach Schrems-II DSGVO-kritisch',
        severity: 'high',
        fixHint: 'USA ohne Standardvertragsklauseln (SCC) ist nach Schrems-II DSGVO-kritisch. SCC abschließen oder auf EU-Region wechseln. Wir sind kein Anwalt — Datenschutz-Experten einschalten.',
      },
    }
  }

  if (userAnswer === 'USA mit SCC') {
    return {
      questionKey: key,
      status: 'input-needed',
      finding: {
        message: 'Daten-Speicherort USA mit SCC — Aktualität und korrekte Umsetzung unbekannt',
        severity: 'medium',
        fixHint: 'SCC vorhanden — prüfe ob sie aktuell und korrekt umgesetzt sind. Wir sind kein Anwalt.',
      },
    }
  }

  if (userAnswer === 'Weiß ich nicht' || userAnswer === undefined) {
    return {
      questionKey: key,
      status: 'input-needed',
      finding: {
        message: 'Daten-Speicherort unbekannt — DSGVO-Konformität nicht prüfbar',
        severity: 'medium',
        fixHint: 'Bitte kläre wo eure Produktionsdaten gespeichert werden.',
      },
    }
  }

  // Anderer Wert
  return {
    questionKey: key,
    status: 'input-needed',
    finding: {
      message: `Daten-Speicherort "${userAnswer}" — DSGVO-Einschätzung nicht möglich`,
      severity: 'medium',
      fixHint: 'Bitte kläre wo eure Produktionsdaten gespeichert werden.',
    },
  }
}

// ─── Haupt-Funktion ───────────────────────────────────────────────────────────

/**
 * Führt alle 3 Stufe-1-Compliance-Checks aus.
 * Gibt ein Array von ComplianceCheckResult zurück.
 * Nur Checks für die Antworten vorliegen ODER Code-Checks helfen.
 */
export function runComplianceResolver(ctx: AuditContext): ComplianceCheckResult[] {
  const answers = ctx.complianceAnswers ?? {}
  return [
    checkPrivacyPolicy(ctx, answers.has_privacy_policy),
    checkDeletionProcess(ctx, answers.has_deletion_process),
    checkDataLocation(answers.data_location),
  ]
}

// ─── Findings-Generierung ─────────────────────────────────────────────────────

/**
 * Wandelt ComplianceCheckResult-Einträge mit Status 'needs-attention' | 'input-needed'
 * in Finding-Objekte um.
 * isKiller = false für alle Resolver-Findings in Stufe 1 (Komitee-Entscheidung).
 */
export function complianceResultsToFindings(results: ComplianceCheckResult[]): Finding[] {
  const findings: Finding[] = []
  for (const result of results) {
    if (
      (result.status === 'needs-attention' || result.status === 'input-needed') &&
      result.finding
    ) {
      findings.push({
        severity: result.finding.severity,
        message: result.finding.message,
        fixHint: result.finding.fixHint,
        agentSource: 'dsgvo',
        agentRuleId: `compliance-${result.questionKey}`,
        filePath: undefined,
        isKiller: false,
      })
    }
  }
  return findings
}

// ─── Code-Finding-Filter ──────────────────────────────────────────────────────

/**
 * Entfernt Code-Findings die durch User-Bestätigung obsolet wurden.
 * User-Vorrang total: wenn User bestätigt hat, kein Code-Finding.
 *
 * has_privacy_policy === true  → entferne cat-4-rule-11 Findings
 * has_deletion_process === true → entferne cat-4-rule-17 und cat-4-rule-18 Findings
 */
export function filterFindingsByComplianceAnswers(
  findings: Finding[],
  answers: ComplianceAnswers | undefined,
): Finding[] {
  if (!answers) return findings

  return findings.filter((f) => {
    const ruleId = f.agentRuleId ?? ''

    // User bestätigt Datenschutzseite → cat-4-rule-11 entfernen
    if (answers.has_privacy_policy === true && ruleId.includes('cat-4-rule-11')) {
      return false
    }

    // User bestätigt Löschprozess → cat-4-rule-17 und cat-4-rule-18 entfernen
    if (answers.has_deletion_process === true &&
        (ruleId.includes('cat-4-rule-17') || ruleId.includes('cat-4-rule-18'))) {
      return false
    }

    return true
  })
}
