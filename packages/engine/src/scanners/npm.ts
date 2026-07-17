import { randomUUID } from 'node:crypto'

import { FindingSchema, emptyFindings, emptyIssues } from '../schemas.js'
import { parseNpmManifest } from './parse-npm-manifest.js'
import { makeScanIssue } from './port.js'

export const npmManifestScanner = {
  id: 'npm-manifest',

  /**
   * @param {{ ecosystems: string[] }} detection
   */
  supports(detection) {
    return detection.ecosystems.includes('npm')
  },

  /**
   * @param {{
   *   manifests?: string[],
   *   lockfiles?: string[],
   * }} [ctx]
   */
  async scan(ctx) {
    const context = ctx ?? {}
    const findings = emptyFindings()
    const issues = emptyIssues()
    const manifests = context.manifests ?? []
    const lockfiles = context.lockfiles ?? []

    for (const manifestPath of manifests) {
      if (!String(manifestPath).endsWith('package.json')) continue

      const parsed = await parseNpmManifest(manifestPath)
      if (!parsed.ok) {
        issues.push(
          makeScanIssue('PARSE_FAILED', parsed.error ?? 'Parse failed', {
            path: manifestPath,
            ecosystem: 'npm',
            retriable: false,
          }),
        )
        continue
      }

      for (const pkg of parsed.packages) {
        findings.push(
          FindingSchema.parse({
            id: randomUUID(),
            vulnerability: {
              ids: [],
              title: '',
              severity: 'low',
              summary: null,
              url: null,
              fixedIn: null,
              publishedAt: null,
            },
            occurrence: {
              package: {
                ecosystem: 'npm',
                name: pkg.name,
                version: pkg.version || null,
                purl: null,
                range: pkg.range,
              },
              kind: 'direct',
              manifestPath,
              lockfilePath: lockfiles[0] ?? null,
              dependencyPath: [pkg.name],
              manifestLocator: {
                packageName: pkg.name,
                section: pkg.section,
                line: pkg.line,
                charStart: pkg.charStart,
                charEnd: pkg.charEnd,
              },
            },
            fix: null,
            scanner: 'npm-manifest',
          }),
        )
      }
    }

    return {
      findings,
      issues,
      scannersUsed: ['npm-manifest'],
    }
  },
}
