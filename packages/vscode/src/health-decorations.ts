import * as vscode from 'vscode'

const latestDecorationType = vscode.window.createTextEditorDecorationType({
  after: {
    color: '#16a34a',
    fontStyle: 'normal',
    fontWeight: '600',
    margin: '0 0 0 8px',
  },
})

const upgradeDecorationType = vscode.window.createTextEditorDecorationType({
  after: {
    color: '#2563eb',
    fontStyle: 'normal',
    fontWeight: '600',
    margin: '0 0 0 8px',
  },
})

const deprecatedDecorationType = vscode.window.createTextEditorDecorationType({
  after: {
    color: '#dc2626',
    fontStyle: 'italic',
    fontWeight: '600',
    margin: '0 0 0 8px',
  },
})

const vulnDecorationType = vscode.window.createTextEditorDecorationType({
  after: {
    color: '#d97706',
    fontStyle: 'normal',
    fontWeight: '700',
    margin: '0 0 0 8px',
  },
})

export function applyHealthDecorations(editor, healthResults) {
  if (!editor || !editor.document.fileName.endsWith('package.json')) return

  const latest: vscode.DecorationOptions[] = []
  const upgrade: vscode.DecorationOptions[] = []
  const deprecated: vscode.DecorationOptions[] = []
  const vuln: vscode.DecorationOptions[] = []

  for (const pkg of healthResults) {
    if (pkg.lineNumber < 0) continue

    const line = editor.document.lineAt(pkg.lineNumber)
    const range = new vscode.Range(line.range.end, line.range.end)

    if (pkg.deprecated) {
      deprecated.push({ range, renderOptions: { after: { contentText: '// ⚠ deprecated' } } })
    } else if (pkg.cvssScore != null) {
      const score = pkg.cvssScore
      const color = score >= 9 ? '#dc2626' : score >= 7 ? '#d97706' : score >= 4 ? '#2563eb' : '#16a34a'
      const label = pkg.latest && !isOnLatest(pkg.currentVersion, pkg.latest)
        ? `// ↗ ${pkg.latest}`
        : '// ✓ latest'
      vuln.push({
        range,
        renderOptions: { after: { contentText: `${label} CVSS ${score}`, color } },
      })
    } else if (pkg.latest && !isOnLatest(pkg.currentVersion, pkg.latest)) {
      upgrade.push({ range, renderOptions: { after: { contentText: `// ↗ ${pkg.latest}` } } })
    } else if (pkg.latest) {
      latest.push({ range, renderOptions: { after: { contentText: '// ✓ latest' } } })
    }
  }

  editor.setDecorations(latestDecorationType, latest)
  editor.setDecorations(upgradeDecorationType, upgrade)
  editor.setDecorations(deprecatedDecorationType, deprecated)
  editor.setDecorations(vulnDecorationType, vuln)
}

export function clearHealthDecorations(editor) {
  if (!editor) return
  editor.setDecorations(latestDecorationType, [])
  editor.setDecorations(upgradeDecorationType, [])
  editor.setDecorations(deprecatedDecorationType, [])
  editor.setDecorations(vulnDecorationType, [])
}

function isOnLatest(current, latest) {
  return current.replace(/^[\^~>=<]*/, '').trim() === latest
}
