import * as vscode from 'vscode'

export class HealthCodeLensProvider {
  _packages: any[] = []
  _onDidChangeCodeLenses = new vscode.EventEmitter<void>()
  onDidChangeCodeLenses = this._onDidChangeCodeLenses.event

  updatePackages(packages) {
    this._packages = packages ?? []
    this._onDidChangeCodeLenses.fire()
  }

  provideCodeLenses(document) {
    if (!document.fileName.endsWith('package.json')) return []

    const lenses: vscode.CodeLens[] = []

    for (const pkg of this._packages) {
      const line = pkg.lineNumber
      if (line < 0) continue

      const range = new vscode.Range(line, 0, line, 0)
      const hasUpdate = pkg.latest && !isOnLatest(pkg.currentVersion, pkg.latest)
      const score = pkg.cvssScore

      if (pkg.deprecated) {
        lenses.push(
          new vscode.CodeLens(range, {
            title: '⚠ deprecated',
            command: 'vulnlens.showDeprecation',
            arguments: [pkg],
          }),
        )
      } else if (hasUpdate) {
        const scoreText = score != null ? ` CVSS ${score}` : ''
        lenses.push(
          new vscode.CodeLens(range, {
            title: `↗ ${pkg.latest}${scoreText}`,
            command: 'vulnlens.showVersionHistory',
            arguments: [pkg],
          }),
        )
      } else if (score != null) {
        lenses.push(
          new vscode.CodeLens(range, {
            title: `✓ latest  CVSS ${score}`,
            command: '',
          }),
        )
      }
    }

    return lenses
  }
}

function isOnLatest(current, latest) {
  return current.replace(/^[\^~>=<]*/, '').trim() === latest
}
