import * as vscode from 'vscode'

export class VulnLensCodeLensProvider {
  _findings: any[] = []
  _onDidChangeCodeLenses = new vscode.EventEmitter<void>()
  onDidChangeCodeLenses = this._onDidChangeCodeLenses.event

  updateFindings(findings) {
    this._findings = findings ?? []
    this._onDidChangeCodeLenses.fire()
  }

  provideCodeLenses(document) {
    if (!document.fileName.endsWith('package.json')) return []

    const lenses: vscode.CodeLens[] = []

    for (const finding of this._findings) {
      const locator = finding.occurrence?.manifestLocator
      if (!locator) continue

      const line = locator.line
      const severity = finding.vulnerability.severity
      const name = finding.occurrence.package.name
      const title = finding.vulnerability.title || 'Unknown vulnerability'
      const score = finding.vulnerability.score

      const severityConfig = {
        critical: { icon: '$(error)', color: '#dc2626' },
        high: { icon: '$(warning)', color: '#d97706' },
        moderate: { icon: '$(info)', color: '#2563eb' },
        low: { icon: '$(lightbulb)', color: '#16a34a' },
      }[severity] ?? { icon: '$(info)', color: '#2563eb' }

      const scoreText = score != null ? `  CVSS ${score}` : ''
      const range = new vscode.Range(line, 0, line, 0)
      lenses.push(
        new vscode.CodeLens(range, {
          title: `${severityConfig.icon} ${severity.toUpperCase()}${scoreText}  ${name}: ${title}`,
          command: 'vulnlens.showFinding',
          arguments: [finding],
        }),
      )
    }

    return lenses
  }
}
