import {
  buildCacheKey,
  createCacheStore,
  fingerprintPolicy,
} from './cache.js'
import { detect, hashFile } from './detect.js'
import { applyPolicy } from './policy.js'
import {
  DEFAULT_POLICY,
  ENGINE_API_VERSION,
  emptyBySeverity,
  emptyFindings,
  emptyIssues,
  mutableList,
} from './schemas.js'
import { npmManifestScanner } from './scanners/npm.js'
import { osvScanner } from './scanners/osv.js'
import { createScannerContext, makeScanIssue } from './scanners/port.js'
import { normalizeSeverity } from './severity.js'

const defaultCache = createCacheStore()

/**
 * @param {{
 *   scanners?: Array<{
 *     id: string,
 *     supports: (detection: { ecosystems: string[], root?: string, manifests?: string[], lockfiles?: string[] }) => boolean,
 *     scan: (ctx: object) => Promise<{ findings?: unknown[], issues?: unknown[], scannersUsed?: string[] }>,
 *   }>,
 *   cache?: ReturnType<typeof createCacheStore>,
 *   clock?: () => Date,
 *   runCommand?: unknown,
 *   fetchImpl?: typeof fetch | null,
 *   logger?: { error?: (msg: string) => void } | null,
 * }} [options]
 */
export function createEngine(...args) {
  const opts = args[0] ?? {}
  const scanners = opts.scanners ?? [npmManifestScanner, osvScanner]
  const cache = opts.cache ?? defaultCache
  const clock = opts.clock ?? (() => new Date())
  const runCommand = opts.runCommand ?? null
  const fetchImpl =
    opts.fetchImpl ??
    (typeof globalThis.fetch === 'function'
      ? globalThis.fetch.bind(globalThis)
      : null)
  const logger = opts.logger ?? null

  async function scan(...scanArgs) {
    const req = scanArgs[0] ?? {}
    const roots = req.roots ?? []
    const policy = {
      ...DEFAULT_POLICY,
      ...(req.policy ?? {}),
    }
    const signal = req.signal ?? null

    const issues = emptyIssues()
    let allFindings = emptyFindings()
    const scannersUsed = mutableList()

    const detection = await detect(roots)
    const manifestHashes = mutableList()
    for (const pkg of detection.packages) {
      for (const manifest of pkg.manifests) {
        manifestHashes.push(await hashFile(manifest))
      }
    }

    const cacheKey = buildCacheKey({
      apiVersion: ENGINE_API_VERSION,
      policyFingerprint: fingerprintPolicy(policy),
      manifestHashes,
      scannersUsed: scanners.map((s) => s.id),
    })

    const cached = cache.get(cacheKey)
    if (cached) {
      return {
        ...cached,
        scannedAt: clock().toISOString(),
        stats: {
          ...cached.stats,
          cacheHit: true,
        },
      }
    }

    if (signal?.aborted) {
      issues.push(
        makeScanIssue('CANCELLED', 'Scan was cancelled', { retriable: true }),
      )
      return assembleResult({
        roots,
        findings: emptyFindings(),
        issues,
        scannersUsed,
        clock,
        cacheHit: false,
      })
    }

    for (const pkg of detection.packages) {
      if (signal?.aborted) {
        issues.push(
          makeScanIssue('CANCELLED', 'Scan was cancelled', {
            path: pkg.root,
            retriable: true,
          }),
        )
        break
      }

      const supported = scanners.filter((scanner) => scanner.supports(pkg))
      if (pkg.ecosystems.length > 0 && supported.length === 0) {
        issues.push(
          makeScanIssue(
            'UNSUPPORTED_ECOSYSTEM',
            `No scanner supports ecosystems: ${pkg.ecosystems.join(', ')}`,
            {
              path: pkg.root,
              ecosystem: pkg.ecosystems[0] ?? null,
              retriable: false,
            },
          ),
        )
        continue
      }

      for (const scanner of supported) {
        if (signal?.aborted) {
          issues.push(
            makeScanIssue('CANCELLED', 'Scan was cancelled', {
              path: pkg.root,
              retriable: true,
            }),
          )
          break
        }

        scannersUsed.push(scanner.id)

        try {
          const ctx = createScannerContext({
            root: pkg.root,
            manifests: pkg.manifests,
            lockfiles: pkg.lockfiles,
            policy,
            signal,
            runCommand,
            fetchImpl,
          })
          const result = await scanner.scan(ctx)
          allFindings = allFindings.concat(result.findings ?? [])
          issues.push(...(result.issues ?? []))
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Scanner failed unexpectedly'
          logger?.error?.(message)
          issues.push(
            makeScanIssue('INTERNAL', message, {
              path: pkg.root,
              ecosystem: pkg.ecosystems[0] ?? null,
              retriable: false,
            }),
          )
        }
      }
    }

    const intelFindings = allFindings.filter((finding) => {
      if (finding.scanner === 'npm-manifest') {
        return (
          finding.vulnerability.ids.length > 0 ||
          finding.vulnerability.title.length > 0
        )
      }
      return true
    })

    const normalized = intelFindings.map((finding) => ({
      ...finding,
      vulnerability: {
        ...finding.vulnerability,
        severity: normalizeSeverity(finding.vulnerability.severity),
      },
    }))

    const filteredFindings = applyPolicy(normalized, policy)

    const result = assembleResult({
      roots,
      findings: filteredFindings,
      issues,
      scannersUsed: [...new Set(scannersUsed)],
      clock,
      cacheHit: false,
    })

    if (result.status !== 'failed') {
      cache.set(cacheKey, result)
    }

    return result
  }

  async function clearCache() {
    cache.clear()
  }

  function listScanners() {
    return scanners.map((s) => s.id)
  }

  return {
    scan,
    detect,
    clearCache,
    listScanners,
  }
}

/**
 * @param {{
 *   roots: string[],
 *   findings: Array<{ vulnerability: { severity: string } }>,
 *   issues: Array<{ code: string }>,
 *   scannersUsed: string[],
 *   clock: () => Date,
 *   cacheHit: boolean,
 * }} args
 */
function assembleResult(args) {
  const bySeverity = emptyBySeverity()
  for (const finding of args.findings) {
    const severity = finding.vulnerability.severity
    if (severity === 'low') bySeverity.low += 1
    else if (severity === 'moderate') bySeverity.moderate += 1
    else if (severity === 'high') bySeverity.high += 1
    else if (severity === 'critical') bySeverity.critical += 1
  }

  const status = resolveStatus(args.findings, args.issues)

  return {
    apiVersion: ENGINE_API_VERSION,
    status,
    scannedAt: args.clock().toISOString(),
    roots: args.roots,
    findings: args.findings,
    issues: args.issues,
    stats: {
      bySeverity,
      findingCount: args.findings.length,
      cacheHit: args.cacheHit,
    },
    meta: {
      engineVersion: ENGINE_API_VERSION,
      scannersUsed: args.scannersUsed,
    },
  }
}

/**
 * @param {unknown[]} findings
 * @param {Array<{ code: string }>} issues
 */
function resolveStatus(findings, issues) {
  if (issues.length === 0) {
    return 'ok'
  }
  if (findings.length > 0) {
    return 'degraded'
  }

  const softCodes = new Set([
    'NETWORK_DISABLED',
    'CANCELLED',
    'TIMEOUT',
    'UNSUPPORTED_ECOSYSTEM',
  ])
  if (issues.some((issue) => softCodes.has(issue.code))) {
    return 'degraded'
  }

  return 'failed'
}
