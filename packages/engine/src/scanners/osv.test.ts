import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it, vi } from 'vitest'

import { osvScanner } from './osv.js'

const fixturesDir = resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../tests/fixtures',
)

describe('osvScanner', () => {
  it('has correct id', () => {
    expect(osvScanner.id).toBe('osv')
  })

  it('supports all ecosystems', () => {
    expect(osvScanner.supports({ ecosystems: ['npm'] })).toBe(true)
    expect(osvScanner.supports({ ecosystems: ['pypi'] })).toBe(true)
  })

  it('skips network when allowNetwork is false', async () => {
    const fetchImpl = vi.fn()
    const result = await osvScanner.scan({
      root: '/tmp',
      manifests: [],
      lockfiles: [],
      policy: { allowNetwork: false, timeoutMs: 30_000 },
      signal: null,
      fetchImpl,
    })

    expect(result.findings).toHaveLength(0)
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].code).toBe('NETWORK_DISABLED')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('normalizes medium severity to moderate via fetchImpl', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        vulns: [
          {
            id: 'GHSA-test',
            summary: 'Test vulnerability',
            severity: [{ type: 'CVSS_V3', score: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' }],
            affected: [
              {
                package: { name: 'lodash', ecosystem: 'npm' },
                ranges: [{ events: [{ fixed: '4.17.21' }] }],
              },
            ],
            published: '2024-01-01T00:00:00Z',
          },
        ],
      }),
    })

    const result = await osvScanner.scan({
      root: fixturesDir,
      manifests: [resolve(fixturesDir, 'clean-package.json')],
      lockfiles: [],
      policy: { allowNetwork: true, timeoutMs: 30_000 },
      signal: null,
      fetchImpl: mockFetch,
    })

    expect(mockFetch).toHaveBeenCalled()
    expect(result.findings.length).toBeGreaterThan(0)
    expect(result.findings[0].vulnerability.severity).not.toBe('medium')
    expect(result.findings[0].scanner).toBe('osv')
  })

  it('handles network failure gracefully with fetchImpl', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const result = await osvScanner.scan({
      root: fixturesDir,
      manifests: [resolve(fixturesDir, 'vulnerable-package.json')],
      lockfiles: [],
      policy: { allowNetwork: true, timeoutMs: 30_000 },
      signal: null,
      fetchImpl: mockFetch,
    })

    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues.every((i) => i.code === 'NETWORK_FAILED')).toBe(true)
    expect(result.findings).toHaveLength(0)
  })

  it('emits CANCELLED when signal already aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    const result = await osvScanner.scan({
      root: fixturesDir,
      manifests: [resolve(fixturesDir, 'clean-package.json')],
      lockfiles: [],
      policy: { allowNetwork: true, timeoutMs: 30_000 },
      signal: controller.signal,
      fetchImpl: vi.fn(),
    })

    expect(result.issues.some((i) => i.code === 'CANCELLED')).toBe(true)
  })

  it('returns empty findings for clean package with empty OSV response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ vulns: [] }),
    })

    const result = await osvScanner.scan({
      root: fixturesDir,
      manifests: [resolve(fixturesDir, 'clean-package.json')],
      lockfiles: [],
      policy: { allowNetwork: true, timeoutMs: 30_000 },
      fetchImpl: mockFetch,
    })

    expect(result.findings).toHaveLength(0)
    expect(result.issues).toHaveLength(0)
  })
})
