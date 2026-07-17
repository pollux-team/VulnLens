import { describe, expect, it } from 'vitest'

import {
  buildCacheKey,
  createCacheStore,
  fingerprintPolicy,
} from './cache.js'

describe('createCacheStore', () => {
  it('stores and retrieves values', () => {
    const store = createCacheStore()
    const result = { findings: [], status: 'ok' }
    store.set('key1', result)
    expect(store.get('key1')).toEqual(result)
  })

  it('returns null for missing keys', () => {
    const store = createCacheStore()
    expect(store.get('missing')).toBeNull()
  })

  it('deletes values', () => {
    const store = createCacheStore()
    store.set('key1', { findings: [] })
    store.delete('key1')
    expect(store.get('key1')).toBeNull()
  })

  it('clears all values', () => {
    const store = createCacheStore()
    store.set('key1', { findings: [] })
    store.set('key2', { findings: [] })
    store.clear()
    expect(store.get('key1')).toBeNull()
    expect(store.get('key2')).toBeNull()
  })
})

describe('buildCacheKey', () => {
  it('builds a consistent key from unsorted inputs', () => {
    const key1 = buildCacheKey({
      apiVersion: '1',
      policyFingerprint: 'moderate:true',
      manifestHashes: ['abc', 'def'],
      scannersUsed: ['npm-manifest', 'osv'],
    })

    const key2 = buildCacheKey({
      apiVersion: '1',
      policyFingerprint: 'moderate:true',
      manifestHashes: ['def', 'abc'],
      scannersUsed: ['osv', 'npm-manifest'],
    })

    expect(key1).toBe(key2)
  })

  it('does not mutate input arrays', () => {
    const hashes = ['b', 'a']
    const scanners = ['osv', 'npm-manifest']
    buildCacheKey({
      apiVersion: '1',
      policyFingerprint: 'x',
      manifestHashes: hashes,
      scannersUsed: scanners,
    })
    expect(hashes).toEqual(['b', 'a'])
    expect(scanners).toEqual(['osv', 'npm-manifest'])
  })

  it('produces different keys for different policies', () => {
    const key1 = buildCacheKey({
      apiVersion: '1',
      policyFingerprint: 'moderate:true',
      manifestHashes: ['abc'],
      scannersUsed: ['osv'],
    })
    const key2 = buildCacheKey({
      apiVersion: '1',
      policyFingerprint: 'high:true',
      manifestHashes: ['abc'],
      scannersUsed: ['osv'],
    })
    expect(key1).not.toBe(key2)
  })
})

describe('fingerprintPolicy', () => {
  it('includes key policy fields', () => {
    const fp = fingerprintPolicy({
      minSeverity: 'moderate',
      allowNetwork: true,
      directOnly: false,
      timeoutMs: 30_000,
      enabledEcosystems: 'all',
    })
    expect(fp).toContain('moderate')
    expect(fp).toContain('true')
    expect(fp).toContain('30000')
  })
})
