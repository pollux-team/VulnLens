## ADDED Requirements

### Requirement: Engine API version constant
The engine SHALL export `ENGINE_API_VERSION = "1"`. Every `ScanResult` SHALL carry `apiVersion` equal to this constant. Breaking changes to `ScanResult` or `scan()` semantics SHALL require a new major version documented in `docs/core/versioning.md`.

#### Scenario: API version is exported and stable
- **WHEN** a host imports the engine public surface
- **THEN** `ENGINE_API_VERSION` is available as the string `"1"`

#### Scenario: ScanResult carries the API version
- **WHEN** `scan()` resolves successfully
- **THEN** `result.apiVersion` SHALL equal `ENGINE_API_VERSION`

### Requirement: Domain model types
The engine SHALL export the canonical domain types: `Severity` (`low` < `moderate` < `high` < `critical`), `Ecosystem`, `DependencyKind`, `ScanStatus`, `PackageRef`, `AdvisoryId`, `Vulnerability`, `Occurrence`, `FixHint`, `Finding`, `IgnoreRule`, `Policy`, `ScanRequest`, `ScanIssue`, `ScanResult`. The severity alias `medium` SHALL map to `moderate` during normalization.

#### Scenario: Medium severity is normalized to moderate
- **WHEN** a scanner returns a vulnerability with upstream severity `medium`
- **THEN** the engine normalizes it to `moderate` in the emitted `Finding`

### Requirement: createEngine factory
The engine SHALL export `createEngine(options?: EngineOptions): VulnLensEngine`. `EngineOptions` SHALL accept injectable `scanners`, `cache`, `clock`, `fetchImpl`, and `logger`. The returned engine SHALL expose `scan(request)`, `detect(roots)`, and optionally `clearCache()`/`listScanners()`. Hosts SHALL depend only on `createEngine` and the public types, not on deep scanner imports.

#### Scenario: Default engine uses built-in scanners
- **WHEN** `createEngine()` is called with no options
- **THEN** the returned engine is usable for `scan()` with the built-in npm + OSV scanners

#### Scenario: fetch is injectable for tests
- **WHEN** a test passes a custom `fetchImpl` in `EngineOptions`
- **THEN** the OSV adapter SHALL use that `fetchImpl` instead of global `fetch`

### Requirement: scan orchestrator
`scan(request: ScanRequest)` SHALL orchestrate detect → select scanners → run → merge → normalize → apply policy → cache read/write → return `ScanResult`. It SHALL honor cancellation via `request.signal` on a best-effort basis. It SHALL NOT throw because vulnerabilities were found; findings are data. It SHALL throw only for programmer misuse (invalid request).

#### Scenario: Vulnerabilities are data, not exceptions
- **WHEN** a scan finds moderate+ vulnerabilities
- **THEN** `scan()` resolves with `status: "ok"` and the findings in `result.findings` (no throw)

#### Scenario: Operational problems become issues
- **WHEN** a scanner fails (e.g. network error) but another path could still produce partial results
- **THEN** `scan()` resolves with `status: "degraded"`, the partial findings, and a `ScanIssue` describing the failure

#### Scenario: Cancellation is honored
- **WHEN** `request.signal` is aborted mid-scan
- **THEN** `scan()` resolves promptly with a `CANCELLED` issue and whatever partial findings were already gathered (best-effort)

### Requirement: detect helper
The engine SHALL export `detect(roots: string[]): Promise<DetectionResult>` returning per-root ecosystems, manifests, and lockfiles found. For the MVP it SHALL detect `package.json` files (and note `package-lock.json` when present) under each root.

#### Scenario: npm manifest is detected
- **WHEN** `detect([root])` is called on a directory containing `package.json`
- **THEN** the result lists `npm` in that root's ecosystems and includes the manifest path

### Requirement: applyPolicy pure function
The engine SHALL export `applyPolicy(findings, policy): Finding[]` as a pure function that drops findings below `policy.minSeverity` and respects `policy.allowNetwork` semantics for already-collected findings. For the MVP it SHALL implement the `minSeverity` gate. Hosts and tests MAY call it to re-filter.

#### Scenario: minSeverity filters low findings
- **WHEN** `applyPolicy` is called with `minSeverity: "moderate"` and findings including a `low` one
- **THEN** the `low` finding is excluded from the result

### Requirement: getSeverityRank helper
The engine SHALL export `getSeverityRank(s: Severity): number` returning a stable ordering (`low`=0, `moderate`=1, `high`=2, `critical`=3) for sorting and UI comparison.

#### Scenario: Severities are ordered
- **WHEN** `getSeverityRank("critical")` and `getSeverityRank("low")` are compared
- **THEN** critical's rank is greater than low's

### Requirement: ScanResult shape and invariants
`ScanResult` SHALL include `apiVersion`, `status` (`ok`|`degraded`|`failed`), `scannedAt` (ISO), `roots`, `findings`, `issues`, `stats` (`bySeverity`, `findingCount`, `cacheHit`), and `meta` (`engineVersion`, `scannersUsed`). Findings exposed to hosts SHALL already be filtered by `minSeverity`. The engine SHALL never mutate user manifests/lockfiles and SHALL never execute install/upgrade commands.

#### Scenario: Stats summarize findings
- **WHEN** a scan returns findings of mixed severities
- **THEN** `stats.bySeverity` counts match `findings.length` and `stats.findingCount` equals `findings.length`

### Requirement: Fail-soft error reporting
Operational failures SHALL be reported as `ScanIssue` entries with stable codes (`NETWORK_DISABLED`, `NETWORK_FAILED`, `PARSE_FAILED`, `TIMEOUT`, `CANCELLED`, `UNSUPPORTED_ECOSYSTEM`, `INTERNAL`) plus `message`, `path`, `ecosystem`, and `retriable`. `status: "failed"` means no reliable findings; `status: "degraded"` means partial findings plus issues.

#### Scenario: Failed scan yields no findings and an issue
- **WHEN** a scan cannot produce any reliable findings due to a fatal error
- **THEN** `status` is `"failed"`, `findings` is empty, and at least one `ScanIssue` is present

### Requirement: In-memory cache
The engine SHALL keep an in-memory cache keyed by content hash of manifests in scope plus the policy fingerprint and `ENGINE_API_VERSION`. A cache hit SHALL set `stats.cacheHit = true` and return the cached logical result (with a fresh `scannedAt`). Results with `status: "failed"` SHALL NOT be cached.

#### Scenario: Repeat scan hits cache
- **WHEN** the same roots and policy are scanned twice in a row with unchanged file contents
- **THEN** the second `ScanResult` has `stats.cacheHit = true`

#### Scenario: Failed results are not cached
- **WHEN** a scan completes with `status: "failed"`
- **THEN** no cache entry is written for that key

### Requirement: Engine must not depend on hosts
The `engine` package SHALL NOT import `vscode` or any host-specific package. This SHALL be enforced by `engine/tsconfig.json` path restrictions and verified by a boundary test asserting no `vscode` import under `packages/engine/src`.

#### Scenario: Engine source has no vscode import
- **WHEN** the boundary test scans `packages/engine/src`
- **THEN** it finds zero imports from `vscode`
