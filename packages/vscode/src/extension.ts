import * as vscode from 'vscode'
import {
  createEngine,
  npmManifestScanner,
  osvScanner,
  checkPackageHealth,
} from '@vulnlens/engine'

import { VulnLensCodeLensProvider } from './code-lens.js'
import { tokenToAbortSignal } from './cancel.js'
import { isAutoScanEnabled, readPolicyFromConfig } from './config/policy.js'
import { applyDiagnostics } from './diagnostics.js'
import { showFindingWebview } from './finding-panel.js'
import { HealthCodeLensProvider } from './health-lens.js'
import { applyInlineDecorations } from './health-inline.js'
import { showVersionPicker } from './version-popover.js'
import { updateStatusBar } from './status-bar.js'
import { canAutoScan, isWorkspaceTrusted, untrustedIssue } from './trust.js'

let engine
let statusBarItem
let diagnosticCollection
let autoScanTimer
let codeLensProvider
let healthLensProvider
const AUTO_SCAN_DEBOUNCE_MS = 500

const healthCache = new Map()

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

  codeLensProvider = new VulnLensCodeLensProvider()
  healthLensProvider = new HealthCodeLensProvider()
  const jsonSelector = { language: 'json', pattern: '**/package.json' }
  vscode.languages.registerCodeLensProvider(jsonSelector, codeLensProvider)
  vscode.languages.registerCodeLensProvider(jsonSelector, healthLensProvider)

  context.subscriptions.push(
    vscode.commands.registerCommand('vulnlens.scan', () =>
      runScan(context, { manual: true }),
    ),
    vscode.commands.registerCommand('vulnlens.clearCache', () => {
      engine?.clearCache()
      healthCache.clear()
      vscode.window.showInformationMessage('VulnLens cache cleared')
    }),
    vscode.commands.registerCommand('vulnlens.showFinding', (finding) => {
      if (finding) showFindingWebview(finding)
    }),
    vscode.commands.registerCommand('vulnlens.showDeprecation', (pkg) => {
      if (!pkg) return
      const msg = pkg.deprecationMsg
        ? `${pkg.name} is deprecated:\n\n${pkg.deprecationMsg}`
        : `${pkg.name} is deprecated`
      vscode.window.showWarningMessage(msg, { modal: true })
    }),
    vscode.commands.registerCommand('vulnlens.updateDependency', async (pkg) => {
      if (!pkg?.latest) return
      const editor = vscode.window.activeTextEditor
      if (!editor || !editor.document.fileName.endsWith('package.json')) return

      const line = editor.document.lineAt(pkg.lineNumber)
      const text = line.text
      const match = text.match(/(":\s*")[^"]*(")/)
      if (!match) return

      const prefix = text.slice(0, text.indexOf(match[0]) + match[1].length)
      const suffix = text.slice(text.indexOf(match[0]) + match[0].length - match[2].length)

      await editor.edit((editBuilder) => {
        editBuilder.replace(line.range, `${prefix}${pkg.latest}${suffix}`)
      })

      healthCache.delete(editor.document.fileName)
      vscode.window.showInformationMessage(`Updated ${pkg.name} to ${pkg.latest}`)
    }),
    vscode.commands.registerCommand('vulnlens.showVersionHistory', (pkg) => {
      if (pkg) showVersionPicker(pkg)
    }),
    statusBarItem,
    diagnosticCollection,
  )

  if (vscode.workspace.workspaceFolders && isAutoScanEnabled() && canAutoScan()) {
    scheduleAutoScan(context)
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.fileName.endsWith('package.json')) {
        if (isAutoScanEnabled() && canAutoScan()) scheduleAutoScan(context)
        runHealthCheck(doc)
      }
    }),
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (doc.fileName.endsWith('package.json')) {
        healthCache.delete(doc.fileName)
        runHealthCheck(doc)
      }
    }),
    vscode.workspace.onDidGrantWorkspaceTrust(() => {
      if (isAutoScanEnabled()) scheduleAutoScan(context)
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor?.document.fileName.endsWith('package.json')) {
        applyCachedHealth(editor)
        runHealthCheck(editor.document)
      }
    }),
    vscode.window.onDidChangeVisibleTextEditors((editors) => {
      for (const editor of editors) {
        if (editor.document.fileName.endsWith('package.json')) {
          applyCachedHealth(editor)
          runHealthCheck(editor.document)
        }
      }
    }),
  )

  if (vscode.window.activeTextEditor?.document.fileName.endsWith('package.json')) {
    runHealthCheck(vscode.window.activeTextEditor.document)
  }
}

export function deactivate() {
  if (autoScanTimer) {
    clearTimeout(autoScanTimer)
    autoScanTimer = null
  }
  diagnosticCollection?.dispose()
  statusBarItem?.dispose()
}

function applyCachedHealth(editor) {
  const cached = healthCache.get(editor.document.uri.toString())
  if (cached) {
    applyInlineDecorations(editor, cached)
    healthLensProvider.updatePackages(cached)
  }
}

function scheduleAutoScan(context) {
  if (autoScanTimer) clearTimeout(autoScanTimer)
  autoScanTimer = setTimeout(() => {
    autoScanTimer = null
    runScan(context, { manual: false })
  }, AUTO_SCAN_DEBOUNCE_MS)
}

async function runHealthCheck(doc) {
  const editor = vscode.window.activeTextEditor
  if (!editor || editor.document.uri.toString() !== doc.uri.toString()) return

  const cached = healthCache.get(doc.uri.toString())
  if (cached) {
    applyInlineDecorations(editor, cached)
    healthLensProvider.updatePackages(cached)
    return
  }

  const results = await checkPackageHealth(doc.fileName, {})
  healthCache.set(doc.uri.toString(), results)
  applyInlineDecorations(editor, results)
  healthLensProvider.updatePackages(results)
}

async function runScan(context, options = { manual: false }) {
  if (!engine) return

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (!workspaceFolder) return

  if (!isWorkspaceTrusted()) {
    const issue = untrustedIssue()
    const emptyResult = {
      findings: [],
      issues: [issue],
      stats: { bySeverity: { low: 0, moderate: 0, high: 0, critical: 0 }, findingCount: 0, cacheHit: false },
      status: 'degraded',
    }
    applyDiagnostics(diagnosticCollection, emptyResult)
    updateStatusBar(statusBarItem, emptyResult)
    codeLensProvider.updateFindings([])
    if (options.manual) vscode.window.showWarningMessage(issue.message)
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
        const result = await engine.scan({ roots: [workspaceFolder.uri.fsPath], policy, signal })
        applyDiagnostics(diagnosticCollection, result)
        updateStatusBar(statusBarItem, result)
        codeLensProvider.updateFindings(result.findings ?? [])
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        vscode.window.showErrorMessage(`VulnLens scan failed: ${message}`)
      }
    },
  )
}
