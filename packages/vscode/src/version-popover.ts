import * as vscode from 'vscode'

interface VersionItem extends vscode.QuickPickItem {
  version: string
  isCurrent: boolean
  isLatest: boolean
}

export async function showVersionPicker(pkg) {
  if (!pkg?.versions?.length) return

  const currentClean = pkg.currentVersion.replace(/^[\^~>=<]*/, '').trim()

  const items: VersionItem[] = pkg.versions.map((v) => {
    const isCurrent = v === currentClean
    const isLatest = v === pkg.latest
    const vulns = pkg.allVulnerabilities?.[v] ?? []
    const score = vulns.length > 0 ? vulns[0].score : null

    const labels: string[] = []
    if (isCurrent) labels.push('$(check) installed')
    if (isLatest) labels.push('$(star) latest')
    if (score != null) labels.push(`CVSS ${score}`)

    return {
      label: `${isCurrent ? '$(check) ' : ''}${v}`,
      description: labels.join('  '),
      detail: vulns.length > 0 ? vulns[0].title : undefined,
      version: v,
      isCurrent,
      isLatest,
    }
  })

  if (pkg.latest && !items.some((i) => i.version === pkg.latest)) {
    items.unshift({
      label: `$(arrow-up) Update to ${pkg.latest}`,
      description: 'latest version',
      detail: undefined,
      version: pkg.latest,
      isCurrent: false,
      isLatest: true,
    })
  }

  const selected = await vscode.window.showQuickPick(items, {
    title: `${pkg.name}  (${pkg.currentVersion})`,
    placeHolder: 'Select a version',
    matchOnDescription: true,
  })

  if (!selected || selected.isCurrent) return

  const editor = vscode.window.activeTextEditor
  if (!editor || !editor.document.fileName.endsWith('package.json')) return

  const line = editor.document.lineAt(pkg.lineNumber)
  const text = line.text
  const match = text.match(/(":\s*")[^"]*(")/)
  if (!match) return

  const prefix = text.slice(0, text.indexOf(match[0]) + match[1].length)
  const suffix = text.slice(text.indexOf(match[0]) + match[0].length - match[2].length)

  await editor.edit((editBuilder) => {
    editBuilder.replace(line.range, `${prefix}${selected.version}${suffix}`)
  })

  vscode.window.showInformationMessage(`Updated ${pkg.name} to ${selected.version}`)
}
