# Engine API

Engine API version: **v1** (`ENGINE_API_VERSION = "1"`)

## Primary Entrypoints

### `scan(request: ScanRequest): Promise<ScanResult>`

Orchestrates detect → select scanners → run → merge → normalize → apply policy → cache read/write → return.

**Guarantees:**
- Honors cancellation when signal aborted (best-effort; partial results only).
- Never throws for "vulnerabilities found" (findings are data).
- May throw only for programmer misuse (invalid request).
- Operational problems become `issues` + `status`.

### `detect(roots: string[]): Promise<DetectionResult>`

Optional public helper. Returns per-root ecosystems, manifests, and lockfiles found.

**DetectionResult:**
- `packages`: Array<{ root, ecosystems, manifests, lockfiles }>

### `applyPolicy(findings: Finding[], policy: Policy): Finding[]`

Pure function; exported for tests and hosts that re-filter.

### `getSeverityRank(s: Severity): number`

Pure helper for sorting/UI. Returns stable ordering (low=0, moderate=1, high=2, critical=3).

## Factory

### `createEngine(options?: EngineOptions): VulnLensEngine`

**EngineOptions:**
- `scanners?: Scanner[]` (default built-ins)
- `cache?: CacheStore`
- `clock?: () => Date`
- `runCommand?: RunCommand` (injectable for tests)
- `fetchImpl?: typeof fetch` (for OSV tests)
- `logger?: Logger` (no secrets)

**VulnLensEngine:**
- `scan(request)`
- `detect(roots)`
- optional: `clearCache()`, `listScanners()`

## What is NOT Public API

- Raw npm audit JSON types
- OSV wire types
- Internal merge heuristics
- VS Code mapping utilities
- Webview HTML
