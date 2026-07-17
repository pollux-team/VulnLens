# Cache

## Key Material

The cache key is composed of:
1. `ENGINE_API_VERSION`
2. Policy fingerprint (semantic fields only: minSeverity, allowNetwork)
3. Sorted content hashes of manifests in scope
4. Scanner id + version tag

## Store Interface

```typescript
CacheStore {
  get(key: string): ScanResult | null
  set(key: string, result: ScanResult, ttlMs?: number): void
  delete(key: string): void
  clear(): void
}
```

## Rules

- Cache hits set `stats.cacheHit = true`.
- `status: failed` results are NOT cached (TTL 0 or short).
- Same `Policy` + same file hashes ⇒ cache-eligible identical logical result.
- `scannedAt` is freshened on cache hit.
