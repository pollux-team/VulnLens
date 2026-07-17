#!/usr/bin/env node

import { createEngine, checkPackageHealth } from '@vulnlens/engine'

const args = process.argv.slice(2)
const command = args[0]

function parseFlags(args) {
  const flags = { minSeverity: 'low', network: true }
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--min-severity' && args[i + 1]) {
      flags.minSeverity = args[i + 1]
      i++
    }
    if (args[i] === '--no-network') {
      flags.network = false
    }
  }
  return flags
}

function output(data) {
  process.stdout.write(JSON.stringify(data) + '\n')
}

function error(message) {
  process.stderr.write(message + '\n')
  process.exit(1)
}

async function scan(projectPath) {
  const flags = parseFlags(args)
  const engine = createEngine()

  const result = await engine.scan({
    roots: [projectPath],
    policy: {
      minSeverity: flags.minSeverity,
      allowNetwork: flags.network,
    },
  })

  const findings = result.findings.map((f) => ({
    package: f.occurrence.package.name,
    version: f.occurrence.package.version,
    range: f.occurrence.package.range,
    severity: f.vulnerability.severity,
    cvss: f.vulnerability.score,
    title: f.vulnerability.title,
    fix: f.vulnerability.fixedIn?.[0] ?? null,
    url: f.vulnerability.url,
    line: f.occurrence.manifestLocator?.line ?? null,
    manifestPath: f.occurrence.manifestPath,
  }))

  output({
    status: result.status,
    findings,
    stats: result.stats,
    issues: result.issues,
  })
}

async function health(manifestPath) {
  const results = await checkPackageHealth(manifestPath, {})
  output(results)
}

if (!command) {
  error('Usage: vulnens-cli <scan|health> [path] [flags]')
}

const targetPath = args[1] || '.'

try {
  if (command === 'scan') {
    await scan(targetPath)
  } else if (command === 'health') {
    await health(targetPath)
  } else {
    error(`Unknown command: ${command}. Use "scan" or "health".`)
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  error(message)
}
