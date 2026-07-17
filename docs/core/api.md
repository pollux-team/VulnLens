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

## Dependency Health Advisor

### `fetchNpmMetadata(name: string): Promise<NpmMetadata>`

Queries the npm registry for package metadata. Results are cached in-memory with a 5-minute TTL.

**NpmMetadata:**
- `latest: string | null` — latest published version
- `deprecated: boolean` — whether the latest version is deprecated
- `deprecationMsg: string | null` — deprecation message if available
- `versions: string[]` — all published versions (sorted newest first)

### `queryVulnerabilityScores(name: string, versions: string[], fetchImpl?: typeof fetch): Promise<Record<string, VulnerabilityScore[]>>`

Queries the OSV batch API (`/v1/querybatch`) for CVSS scores across multiple versions of a package.

**VulnerabilityScore:**
- `score: number | null` — highest CVSS score (0-10)
- `severity: 'low' | 'moderate' | 'high' | 'critical'`
- `title: string` — vulnerability title
- `url: string | null` — advisory URL

### `checkPackageHealth(manifestPath: string, options?: { fetchImpl?: typeof fetch }): Promise<PackageHealth[]>`

Combines registry metadata and vulnerability data for all dependencies in a `package.json` file.

**PackageHealth:**
- `name: string` — package name
- `currentVersion: string` — version string from manifest (e.g., `^4.17.15`)
- `section: string` — dependency section (dependencies, devDependencies, etc.)
- `lineNumber: number` — line number in the file (0-indexed)
- `latest: string | null` — latest published version
- `deprecated: boolean`
- `deprecationMsg: string | null`
- `versions: string[]` — last 5 published versions
- `cvssScore: number | null` — CVSS score for the installed version
- `latestCvss: number | null` — CVSS score for the latest version
- `vulnerabilities: VulnerabilityScore[]` — vulnerabilities for installed version
- `latestVulnerabilities: VulnerabilityScore[]` — vulnerabilities for latest version

## What is NOT Public API

- Raw npm audit JSON types
- OSV wire types
- Internal merge heuristics
- VS Code mapping utilities
- Webview HTML
