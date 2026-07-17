import * as vscode from 'vscode'

import { findingToDiagnostic } from './mapping/range.js'

export function applyDiagnostics(collection, result) {
  collection.clear()

  if (!result?.findings?.length) {
    return
  }

  const byPath = new Map()

  for (const finding of result.findings) {
    const diagnostic = findingToDiagnostic(finding)
    if (!diagnostic) continue

    const path = finding.occurrence.manifestPath
    if (!byPath.has(path)) {
      byPath.set(path, [])
    }
    byPath.get(path).push(diagnostic)
  }

  for (const [path, diagnostics] of byPath) {
    collection.set(vscode.Uri.file(path), diagnostics)
  }
}
