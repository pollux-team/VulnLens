import * as vscode from 'vscode'

export function readPolicyFromConfig() {
  const config = vscode.workspace.getConfiguration('vulnlens')
  const minSeverity = config.get('minSeverity', 'moderate')
  const allowNetwork = config.get('allowNetwork', true)

  return {
    minSeverity,
    allowNetwork,
    directOnly: false,
    enabledEcosystems: 'all',
    ignores: [],
    timeoutMs: 30_000,
  }
}

export function isAutoScanEnabled() {
  return vscode.workspace.getConfiguration('vulnlens').get('autoScanOnOpen', true)
}
