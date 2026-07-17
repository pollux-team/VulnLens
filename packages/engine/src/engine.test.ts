import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it, vi } from 'vitest'

import { createCacheStore } from './cache.js'
import { createEngine } from './engine.js'
import { npmManifestScanner } from './scanners/npm.js'
import { osvScanner } from './scanners/osv.js'

async function tempProject(packageJson) {
  const root = await mkdtemp(join(tmpdir(), 'vulnlens-engine-'))
  await writeFile(join(root, 'package.json'), packageJson)
  return root
}

const SAMPLE_PKG = JSON.stringify(
  {
    name: 'sample',
    version: '1.0.0',
    dependencies: {
      lodash: '^4.17.19',
    },
  },
  null,
  2,
)

describe('createEngine', () => {
  it('returns an engine instance', () => {
    const engine = createEngine({ scanners: [] })
    expect(engine).toBeDefined()
    expect(typeof engine.scan).toBe('function')
    expect(typeof engine.detect).toBe('function')
    expect(typeof engine.clearCache).toBe('function')
    expect(typeof engine.listScanners).toBe('function')
  })

  it('lists registered scanners', () => {
    const engine = createEngine({
      scanners: [
        {
          id: 'test',
          supports: () => false,
          scan: async () => ({ findings: [], issues: [], scannersUsed: [] }),
        },
      ],
    })
    expect(engine.listScanners()).toEqual(['test'])
  })

  it('scan returns ScanResult shape without throwing on findings', async () => {
    const root = await tempProject(SAMPLE_PKG)
    const engine = createEngine({ scanners: [] })
    const result = await engine.scan({
      roots: [root],
      policy: {
        minSeverity: 'moderate',
        allowNetwork: true,
        directOnly: false,
        enabledEcosystems: 'all',
        ignores: [],
        timeoutMs: 30_000,
      },
      signal: null,
    })

    expect(result.apiVersion).toBe('1')
    expect(result.findings).toBeInstanceOf(Array)
    expect(result.issues).toBeInstanceOf(Array)
    expect(result.stats).toBeDefined()
    expect(result.meta).toBeDefined()
  })

  it('returns degraded with NETWORK_DISABLED when allowNetwork is false', async () => {
    const root = await tempProject(SAMPLE_PKG)
    const engine = createEngine({
      scanners: [npmManifestScanner, osvScanner],
      cache: createCacheStore(),
    })

    const result = await engine.scan({
      roots: [root],
      policy: {
        minSeverity: 'moderate',
        allowNetwork: false,
        directOnly: false,
        enabledEcosystems: 'all',
        ignores: [],
        timeoutMs: 30_000,
      },
    })

    expect(result.issues.some((i) => i.code === 'NETWORK_DISABLED')).toBe(true)
    expect(result.status).toBe('degraded')
  })

  it('returns CANCELLED when signal is aborted', async () => {
    const root = await tempProject(SAMPLE_PKG)
    const controller = new AbortController()
    controller.abort()
    const engine = createEngine({
      scanners: [osvScanner],
      cache: createCacheStore(),
    })

    const result = await engine.scan({
      roots: [root],
      policy: {
        minSeverity: 'low',
        allowNetwork: true,
        directOnly: false,
        enabledEcosystems: 'all',
        ignores: [],
        timeoutMs: 30_000,
      },
      signal: controller.signal,
    })

    expect(result.issues.some((i) => i.code === 'CANCELLED')).toBe(true)
  })

  it('caches successful results and reports cacheHit', async () => {
    const root = await tempProject(SAMPLE_PKG)
    const cache = createCacheStore()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ vulns: [] }),
    })

    const engine = createEngine({
      scanners: [osvScanner],
      cache,
      fetchImpl: mockFetch,
    })

    const request = {
      roots: [root],
      policy: {
        minSeverity: 'moderate',
        allowNetwork: true,
        directOnly: false,
        enabledEcosystems: 'all',
        ignores: [],
        timeoutMs: 30_000,
      },
    }

    const first = await engine.scan(request)
    expect(first.stats.cacheHit).toBe(false)
    expect(first.status).toBe('ok')

    const second = await engine.scan(request)
    expect(second.stats.cacheHit).toBe(true)

    const callsAfterSecond = mockFetch.mock.calls.length
    await engine.scan(request)
    expect(mockFetch.mock.calls.length).toBe(callsAfterSecond)
  })

  it('does not cache failed results', async () => {
    const root = await tempProject(SAMPLE_PKG)
    const cache = createCacheStore()
    const failing = {
      id: 'fail',
      supports: () => true,
      scan: async () => {
        throw new Error('boom')
      },
    }

    const engine = createEngine({
      scanners: [failing],
      cache,
    })

    const request = {
      roots: [root],
      policy: {
        minSeverity: 'moderate',
        allowNetwork: true,
        directOnly: false,
        enabledEcosystems: 'all',
        ignores: [],
        timeoutMs: 30_000,
      },
    }

    const first = await engine.scan(request)
    expect(first.status).toBe('failed')
    expect(first.stats.cacheHit).toBe(false)

    const second = await engine.scan(request)
    expect(second.stats.cacheHit).toBe(false)
    expect(second.status).toBe('failed')
  })

  it('merges OSV findings and applies minSeverity', async () => {
    const root = await tempProject(SAMPLE_PKG)
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        vulns: [
          {
            id: 'GHSA-low',
            summary: 'Low issue',
            severity: [{ type: 'CVSS_V3', score: 'CVSS:3.1/2.0' }],
            affected: [],
          },
          {
            id: 'GHSA-high',
            summary: 'High issue',
            severity: [{ type: 'CVSS_V3', score: 'CVSS:3.1/8.0' }],
            affected: [],
          },
        ],
      }),
    })

    const engine = createEngine({
      scanners: [osvScanner],
      cache: createCacheStore(),
      fetchImpl: mockFetch,
    })

    const result = await engine.scan({
      roots: [root],
      policy: {
        minSeverity: 'high',
        allowNetwork: true,
        directOnly: false,
        enabledEcosystems: 'all',
        ignores: [],
        timeoutMs: 30_000,
      },
    })

    expect(
      result.findings.every((f) =>
        ['high', 'critical'].includes(f.vulnerability.severity),
      ),
    ).toBe(true)
    expect(result.findings.length).toBeGreaterThan(0)
  })
})
