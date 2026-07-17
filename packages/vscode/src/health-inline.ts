import * as vscode from 'vscode'

const inlineDecorationType = vscode.window.createTextEditorDecorationType({
  textDecoration: 'none',
})

export function applyInlineDecorations(editor, healthResults) {
  if (!editor || !editor.document.fileName.endsWith('package.json')) return

  const decs: vscode.DecorationOptions[] = []

  for (const pkg of healthResults) {
    if (pkg.lineNumber < 0) continue

    const line = editor.document.lineAt(pkg.lineNumber)
    const text = line.text
    const len = text.trimEnd().length
    const range = new vscode.Range(pkg.lineNumber, len, pkg.lineNumber, len)

    const score = pkg.cvssScore
    const hasUpdate = pkg.latest && !isOnLatest(pkg.currentVersion, pkg.latest)

    let inlineText = ''
    let color = '#16a34a'

    if (pkg.deprecated) {
      inlineText = '// ⚠ deprecated'
      color = '#dc2626'
    } else if (score != null) {
      color = score >= 9 ? '#dc2626' : score >= 7 ? '#d97706' : score >= 4 ? '#2563eb' : '#16a34a'
      inlineText = hasUpdate ? `// ↗ ${pkg.latest} CVSS ${score}` : `// ✓ latest CVSS ${score}`
    } else if (hasUpdate) {
      inlineText = `// ↗ ${pkg.latest}`
      color = '#2563eb'
    } else {
      inlineText = '// ✓ latest'
    }

    decs.push({
      range,
      renderOptions: {
        after: {
          contentText: inlineText,
          color,
          fontStyle: 'normal',
          fontWeight: '600',
          margin: '0 0 0 8px',
        },
      },
    })
  }

  editor.setDecorations(inlineDecorationType, decs)
}

export function clearInlineDecorations(editor) {
  if (!editor) return
  editor.setDecorations(inlineDecorationType, [])
}

function isOnLatest(current, latest) {
  return current.replace(/^[\^~>=<]*/, '').trim() === latest
}
