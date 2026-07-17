import * as vscode from 'vscode'

/**
 * Map Finding.occurrence.manifestLocator → VS Code Range.
 * Returns null when locator is missing or invalid.
 */
export function occurrenceToRange(occurrence) {
  const locator = occurrence?.manifestLocator
  if (!locator) {
    return null
  }

  const line = Math.max(0, locator.line ?? 0)
  const charStart = Math.max(0, locator.charStart ?? 0)
  const charEnd = Math.max(charStart, locator.charEnd ?? charStart)

  return new vscode.Range(line, charStart, line, charEnd)
}

export function findingToDiagnostic(finding) {
  const range = occurrenceToRange(finding.occurrence)
  if (!range) {
    return null
  }

  const severityMap = {
    critical: vscode.DiagnosticSeverity.Error,
    high: vscode.DiagnosticSeverity.Warning,
    moderate: vscode.DiagnosticSeverity.Information,
    low: vscode.DiagnosticSeverity.Hint,
  }

  const severity =
    severityMap[finding.vulnerability.severity] ??
    vscode.DiagnosticSeverity.Information

  const diagnostic = new vscode.Diagnostic(
    range,
    `${finding.vulnerability.title} (${finding.vulnerability.severity})`,
    severity,
  )
  diagnostic.source = 'VulnLens'
  diagnostic.code = finding.id
  return diagnostic
}
