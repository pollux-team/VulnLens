import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { npmManifestScanner } from './npm.js'

const fixturesDir = resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../tests/fixtures',
)

describe('npmManifestScanner', () => {
  it('has correct id', () => {
    expect(npmManifestScanner.id).toBe('npm-manifest')
  })

  it('supports npm ecosystem only', () => {
    expect(npmManifestScanner.supports({ ecosystems: ['npm'] })).toBe(true)
    expect(npmManifestScanner.supports({ ecosystems: ['pypi'] })).toBe(false)
  })

  it('parses vulnerable package.json with locations', async () => {
    const result = await npmManifestScanner.scan({
      root: fixturesDir,
      manifests: [resolve(fixturesDir, 'vulnerable-package.json')],
      lockfiles: [],
      policy: { allowNetwork: true, timeoutMs: 30_000 },
      signal: null,
      runCommand: null,
      fetchImpl: null,
    })

    expect(result.findings).toHaveLength(5)
    expect(result.issues).toHaveLength(0)
    expect(result.scannersUsed).toEqual(['npm-manifest'])

    const lodash = result.findings.find(
      (f) => f.occurrence.package.name === 'lodash',
    )
    expect(lodash).toBeDefined()
    expect(lodash.occurrence.package.version).toBe('4.17.19')
    expect(lodash.occurrence.manifestLocator.section).toBe('dependencies')
    expect(lodash.occurrence.manifestLocator.line).toBeGreaterThanOrEqual(0)
    expect(lodash.occurrence.manifestLocator.charEnd).toBeGreaterThan(
      lodash.occurrence.manifestLocator.charStart,
    )
  })

  it('covers all four dependency sections', async () => {
    const result = await npmManifestScanner.scan({
      root: fixturesDir,
      manifests: [resolve(fixturesDir, 'vulnerable-package.json')],
      lockfiles: [],
    })

    const sections = new Set(
      result.findings.map((f) => f.occurrence.manifestLocator.section),
    )
    expect(sections).toEqual(
      new Set([
        'dependencies',
        'devDependencies',
        'optionalDependencies',
        'peerDependencies',
      ]),
    )
  })

  it('handles malformed JSON with PARSE_FAILED', async () => {
    const result = await npmManifestScanner.scan({
      root: fixturesDir,
      manifests: [resolve(fixturesDir, 'malformed-package.json')],
      lockfiles: [],
    })

    expect(result.findings).toHaveLength(0)
    expect(result.issues[0].code).toBe('PARSE_FAILED')
  })

  it('handles JSONC with comments', async () => {
    const result = await npmManifestScanner.scan({
      root: fixturesDir,
      manifests: [resolve(fixturesDir, 'jsonc-package.json')],
      lockfiles: [],
    })

    expect(result.findings).toHaveLength(2)
    expect(result.issues).toHaveLength(0)
  })

  it('parses clean package.json deps', async () => {
    const result = await npmManifestScanner.scan({
      root: fixturesDir,
      manifests: [resolve(fixturesDir, 'clean-package.json')],
      lockfiles: [],
    })

    expect(result.findings).toHaveLength(1)
    expect(result.findings[0].occurrence.package.name).toBe('lodash')
  })
})
