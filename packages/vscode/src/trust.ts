import * as vscode from 'vscode'

export function isWorkspaceTrusted() {
  return vscode.workspace.isTrusted
}

export function untrustedIssue() {
  return {
    code: 'WORKSPACE_UNTRUSTED',
    message: 'Workspace is untrusted; VulnLens scan suppressed',
    path: null,
    ecosystem: null,
    retriable: false,
  }
}

export function canAutoScan() {
  return isWorkspaceTrusted()
}
