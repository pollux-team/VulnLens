import { randomUUID } from 'node:crypto'

import {
  AdvisoryIdSchema,
  FindingSchema,
  emptyFindings,
  emptyIssues,
  mutableList,
} from '../schemas.js'
import { normalizeSeverity } from '../severity.js'
import { parseNpmManifest } from './parse-npm-manifest.js'
import { makeScanIssue } from './port.js'

const OSV_QUERY_URL = 'https://api.osv.dev/v1/query'

export const osvScanner = {
  id: 'osv',

  supports() {
    return true
  },

  /**
   * @param {{
   *   manifests?: string[],
   *   lockfiles?: string[],
   *   policy?: { allowNetwork?: boolean, timeoutMs?: number },
   *   signal?: AbortSignal | null,
   *   fetchImpl?: typeof fetch | null,
   * }} [ctx]
   */
  async scan(ctx) {
    const context = ctx ?? {}
    const findings = emptyFindings()
    const issues = emptyIssues()
    const manifests = context.manifests ?? []
    const lockfiles = context.lockfiles ?? []
    const policy = context.policy ?? { allowNetwork: true, timeoutMs: 30_000 }
    const signal = context.signal ?? null
    const fetchImpl = context.fetchImpl

    if (!policy.allowNetwork) {
      issues.push(
        makeScanIssue(
          'NETWORK_DISABLED',
          'OSV network requests are disabled by policy',
          { retriable: false },
        ),
      )
      return { findings, issues, scannersUsed: ['osv'] }
    }

    if (typeof fetchImpl !== 'function') {
      issues.push(
        makeScanIssue('NETWORK_FAILED', 'No fetch implementation available', {
          retriable: true,
        }),
      )
      return { findings, issues, scannersUsed: ['osv'] }
    }

    const timeoutMs = policy.timeoutMs ?? 30_000

    for (const manifestPath of manifests) {
      if (signal?.aborted) {
        issues.push(
          makeScanIssue('CANCELLED', 'Scan was cancelled', {
            path: manifestPath,
            retriable: true,
          }),
        )
        break
      }

      const packages = await loadPackages(manifestPath)

      for (const pkg of packages) {
        if (signal?.aborted) {
          issues.push(
            makeScanIssue('CANCELLED', 'Scan was cancelled', {
              path: manifestPath,
              ecosystem: pkg.ecosystem,
              retriable: true,
            }),
          )
          break
        }

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

          const onAbort = () => controller.abort()
          if (signal) {
            signal.addEventListener('abort', onAbort, { once: true })
          }

          let response
          try {
            response = await fetchImpl(OSV_QUERY_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                package: {
                  name: pkg.name,
                  ecosystem: mapEcosystem(pkg.ecosystem),
                },
                version: pkg.version,
              }),
              signal: controller.signal,
            })
          } finally {
            clearTimeout(timeoutId)
            if (signal) {
              signal.removeEventListener('abort', onAbort)
            }
          }

          if (!response.ok) {
            issues.push(
              makeScanIssue(
                'NETWORK_FAILED',
                `OSV request failed: ${response.status}`,
                {
                  path: manifestPath,
                  ecosystem: pkg.ecosystem,
                  retriable: true,
                },
              ),
            )
            continue
          }

          const data = await response.json()
          const vulns = data?.vulns ?? []

          for (const vuln of vulns) {
            const severity = extractSeverity(vuln)
            const fixedIn = extractFixedIn(vuln)

            findings.push(
              FindingSchema.parse({
                id: randomUUID(),
                vulnerability: {
                  ids: extractAdvisoryIds(vuln),
                  title: vuln.summary ?? vuln.id ?? 'Unknown vulnerability',
                  severity: normalizeSeverity(severity),
                  summary: vuln.details ?? vuln.summary ?? null,
                  url: vuln.references?.[0]?.url ?? null,
                  fixedIn,
                  publishedAt: vuln.published ?? null,
                },
                occurrence: {
                  package: {
                    ecosystem: 'npm',
                    name: pkg.name,
                    version: pkg.version,
                    purl: null,
                    range: pkg.range,
                  },
                  kind: 'direct',
                  manifestPath,
                  lockfilePath: lockfiles[0] ?? null,
                  dependencyPath: [pkg.name],
                  manifestLocator: pkg.manifestLocator,
                },
                fix: fixedIn?.length
                  ? {
                      type: 'update',
                      message: `Update to ${fixedIn[0]}`,
                      suggestedVersion: fixedIn[0],
                      commandHint: null,
                    }
                  : null,
                scanner: 'osv',
              }),
            )
          }
        } catch (error) {
          if (signal?.aborted) {
            issues.push(
              makeScanIssue('CANCELLED', 'Scan was cancelled', {
                path: manifestPath,
                ecosystem: pkg.ecosystem,
                retriable: true,
              }),
            )
            break
          }

          if (
            error instanceof Error &&
            (error.name === 'AbortError' || error.name === 'TimeoutError')
          ) {
            issues.push(
              makeScanIssue(
                'TIMEOUT',
                `OSV request timed out after ${timeoutMs}ms`,
                {
                  path: manifestPath,
                  ecosystem: pkg.ecosystem,
                  retriable: true,
                },
              ),
            )
          } else {
            const message =
              error instanceof Error ? error.message : 'OSV request failed'
            issues.push(
              makeScanIssue('NETWORK_FAILED', message, {
                path: manifestPath,
                ecosystem: pkg.ecosystem,
                retriable: true,
              }),
            )
          }
        }
      }
    }

    return { findings, issues, scannersUsed: ['osv'] }
  },
}

/**
 * @param {string} manifestPath
 */
async function loadPackages(manifestPath) {
  if (!String(manifestPath).endsWith('package.json')) {
    return []
  }

  const parsed = await parseNpmManifest(manifestPath)
  if (!parsed.ok) {
    return []
  }

  return parsed.packages.map((pkg) => ({
    ecosystem: 'npm',
    name: pkg.name,
    version: pkg.version,
    range: pkg.range,
    manifestLocator: {
      packageName: pkg.name,
      section: pkg.section,
      line: pkg.line,
      charStart: pkg.charStart,
      charEnd: pkg.charEnd,
    },
  }))
}

/**
 * @param {any} vuln
 */
function extractSeverity(vuln) {
  for (const entry of vuln.severity ?? []) {
    const score = String(entry.score ?? '')
    const numbers = [...score.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) =>
      Number.parseFloat(m[1]),
    )
    // Prefer last number so "CVSS:3.1/8.0" uses 8.0, not 3.1
    if (numbers.length > 0) {
      const cvss = numbers.length > 1 ? numbers[numbers.length - 1] : numbers[0]
      if (cvss >= 9) return 'critical'
      if (cvss >= 7) return 'high'
      if (cvss >= 4) return 'moderate'
      return 'low'
    }
    if (entry.type === 'medium' || entry.score === 'MEDIUM') {
      return 'medium'
    }
  }
  return 'moderate'
}

/**
 * @param {any} vuln
 */
function extractFixedIn(vuln) {
  const fixed = mutableList()
  for (const affected of vuln.affected ?? []) {
    for (const range of affected.ranges ?? []) {
      for (const event of range.events ?? []) {
        if (event.fixed) {
          fixed.push(event.fixed)
        }
      }
    }
  }
  return fixed.length > 0 ? fixed : null
}

/**
 * @param {any} vuln
 */
function extractAdvisoryIds(vuln) {
  const ids = mutableList()
  if (vuln.id) {
    ids.push(AdvisoryIdSchema.parse({ system: 'osv', value: vuln.id }))
  }
  for (const alias of vuln.aliases ?? []) {
    if (String(alias).startsWith('CVE-')) {
      ids.push(AdvisoryIdSchema.parse({ system: 'cve', value: alias }))
    } else if (String(alias).startsWith('GHSA-')) {
      ids.push(AdvisoryIdSchema.parse({ system: 'ghsa', value: alias }))
    } else {
      ids.push(AdvisoryIdSchema.parse({ system: 'other', value: alias }))
    }
  }
  return ids
}

/**
 * @param {string} ecosystem
 */
function mapEcosystem(ecosystem) {
  if (ecosystem === 'npm') return 'npm'
  if (ecosystem === 'pypi') return 'PyPI'
  if (ecosystem === 'go') return 'Go'
  return ecosystem
}
