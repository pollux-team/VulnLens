import { LRUCache } from 'lru-cache'

/**
 * @param {{ max?: number, ttl?: number }} [options]
 */
export function createCacheStore(...args) {
  const opts = args[0] ?? {}
  const max = opts.max ?? 100
  const ttl = opts.ttl ?? 60 * 60 * 1000
  const cache = new LRUCache({ max, ttl, ttlAutopurge: false })

  return {
    get(key) {
      const value = cache.get(key)
      return value === undefined ? null : value
    },
    set(key, result, ttlMs) {
      if (ttlMs === undefined) {
        cache.set(key, result)
      } else {
        cache.set(key, result, { ttl: ttlMs })
      }
    },
    delete(key) {
      cache.delete(key)
    },
    clear() {
      cache.clear()
    },
  }
}

/**
 * @param {{
 *   apiVersion: string,
 *   policyFingerprint: string,
 *   manifestHashes: string[],
 *   scannersUsed: string[],
 * }} input
 */
export function buildCacheKey(input) {
  const hashes = [...input.manifestHashes].sort()
  const scanners = [...input.scannersUsed].sort()
  return [
    input.apiVersion,
    input.policyFingerprint,
    hashes.join(':'),
    scanners.join(':'),
  ].join('|')
}

/**
 * @param {{
 *   minSeverity: string,
 *   allowNetwork: boolean,
 *   directOnly: boolean,
 *   timeoutMs: number,
 *   enabledEcosystems: string | string[],
 * }} policy
 */
export function fingerprintPolicy(policy) {
  return [
    policy.minSeverity,
    String(policy.allowNetwork),
    String(policy.directOnly),
    String(policy.timeoutMs),
    Array.isArray(policy.enabledEcosystems)
      ? [...policy.enabledEcosystems].sort().join(',')
      : policy.enabledEcosystems,
  ].join(':')
}
