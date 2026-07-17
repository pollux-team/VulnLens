import * as vscode from 'vscode'
import {
  createEngine,
  npmManifestScanner,
  osvScanner,
} from '@vulnlens/engine'

import { tokenToAbortSignal } from './cancel.js'
import { isAutoScanEnabled, readPolicyFromConfig } from './config/policy.js'
import { applyDiagnostics } from './diagnostics.js'
import { updateStatusBar } from './status-bar.js'
import { canAutoScan, isWorkspaceTrusted, untrustedIssue } from './trust.js'

let engine = null
let statusBarItem = null
let diagnosticCollection = null
let autoScanTimer = null
const AUTO_SCAN_DEBOUNCE_MS = 500

export function activate(context) {
  console.log('VulnLens ready')

  diagnosticCollection = vscode.languages.createDiagnosticCollection('vulnlens')
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0,
  )
  statusBarItem.text = 'VulnLens'
  statusBarItem.tooltip = 'VulnLens: No scan yet'
  statusBarItem.show()

  engine = createEngine({
    scanners: [npmManifestScanner, osvScanner],
  })

  const scanCommand = vscode.commands.registerCommand('vulnlens.scan', () =>
    runScan(context, { manual: true }),
  )
  const clearCacheCommand = vscode.commands.registerCommand(
    'vulnlens.clearCache',
    () => {
      engine?.clearCache()
      vscode.window.showInformationMessage('VulnLens cache cleared')
    },
  )

  context.subscriptions.push(
    scanCommand,
    clearCacheCommand,
    statusBarItem,
    diagnosticCollection,
  )

  if (vscode.workspace.workspaceFolders && isAutoScanEnabled() && canAutoScan()) {
    scheduleAutoScan(context)
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.fileName.endsWith('package.json') && isAutoScanEnabled() && canAutoScan()) {
        scheduleAutoScan(context)
      }
    }),
  )

  context.subscriptions.push(
    vscode.workspace.onDidGrantWorkspaceTrust(() => {
      if (isAutoScanEnabled()) {
        scheduleAutoScan(context)
      }
    }),
  )
}

export function deactivate() {
  if (autoScanTimer) {
    clearTimeout(autoScanTimer)
    autoScanTimer = null
  }
  diagnosticCollection?.dispose()
  statusBarItem?.dispose()
}

function scheduleAutoScan(context) {
  if (autoScanTimer) {
    clearTimeout(autoScanTimer)
  }
  autoScanTimer = setTimeout(() => {
    autoScanTimer = null
    runScan(context, { manual: false })
  }, AUTO_SCAN_DEBOUNCE_MS)
}

async function runScan(context, options = {}) {
  if (!engine) return

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (!workspaceFolder) return

  if (!isWorkspaceTrusted()) {
    const issue = untrustedIssue()
    applyDiagnostics(diagnosticCollection, {
      findings: [],
      issues: [issue],
      stats: {
        bySeverity: { low: 0, moderate: 0, high: 0, critical: 0 },
        findingCount: 0,
        cacheHit: false,
      },
      status: 'degraded',
    })
    updateStatusBar(statusBarItem, {
      findings: [],
      issues: [issue],
      stats: {
        bySeverity: { low: 0, moderate: 0, high: 0, critical: 0 },
        findingCount: 0,
        cacheHit: false,
      },
      status: 'degraded',
    })
    if (options.manual) {
      vscode.window.showWarningMessage(issue.message)
    }
    return
  }

  const policy = readPolicyFromConfig()

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'VulnLens: Scanning...',
      cancellable: true,
    },
    async (_progress, token) => {
      const signal = tokenToAbortSignal(token)

      try {
        const result = await engine.scan({
          roots: [workspaceFolder.uri.fsPath],
          policy,
          signal,
        })

        applyDiagnostics(diagnosticCollection, result)
        updateStatusBar(statusBarItem, result)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        vscode.window.showErrorMessage(`VulnLens scan failed: ${message}`)
      }
    },
  )
}
