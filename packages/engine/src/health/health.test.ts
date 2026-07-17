import { describe, it, expect, vi } from 'vitest'
import { fetchNpmMetadata } from './registry.js'
import { queryVulnerabilityScores } from './vulnerability.js'
import { checkPackageHealth } from './advisor.js'

describe('fetchNpmMetadata', () => {
  it('returns metadata for a known package', async () => {
    const meta = await fetchNpmMetadata('express')
    expect(meta.latest).toBeTruthy()
    expect(meta.deprecated).toBe(false)
    expect(meta.versions.length).toBeGreaterThan(0)
  })

  it('returns empty for unknown package', async () => {
    const meta = await fetchNpmMetadata('nonexistent-pkg-xyz-12345')
    expect(meta.latest).toBeNull()
    expect(meta.versions).toEqual([])
  })

  it('caches results', async () => {
    const first = await fetchNpmMetadata('lodash')
    const second = await fetchNpmMetadata('lodash')
    expect(first.latest).toBe(second.latest)
  })
})

describe('queryVulnerabilityScores', () => {
  it('returns scores for versions with known vulns', async () => {
    const scores = await queryVulnerabilityScores('lodash', ['4.17.15'])
    expect(scores['4.17.15']).toBeDefined()
    expect(Array.isArray(scores['4.17.15'])).toBe(true)
  })

  it('returns empty for versions without vulns', async () => {
    const scores = await queryVulnerabilityScores('lodash', ['4.17.21'])
    expect(scores['4.17.21']).toBeDefined()
  })
})

describe('checkPackageHealth', () => {
  it('returns empty for non-package.json', async () => {
    const result = await checkPackageHealth('/tmp/readme.md')
    expect(result).toEqual([])
  })

  it('returns empty for nonexistent file', async () => {
    const result = await checkPackageHealth('/tmp/nonexistent-12345/package.json')
    expect(result).toEqual([])
  })
})
