# Domain Model

## Enums

### Severity (ordered)

`low` < `moderate` < `high` < `critical`

Alias mapping: npm/OSV `medium` → `moderate`.

### Ecosystem (extensible)

`npm` | `yarn` | `pnpm` | `pypi` | `crates` | `go` | `rubygems` | `packagist` | `unknown`

### DependencyKind

`direct` | `transitive`

### ScanStatus

`ok` | `degraded` | `failed`

## Core Objects

### PackageRef

- `ecosystem`: Ecosystem
- `name`: string
- `version`: string | null (resolved preferred)
- `purl`: string | null
- `range`: string | null (manifest range, if known)

### AdvisoryId

- `system`: `cve` | `ghsa` | `osv` | `other`
- `value`: string

### Vulnerability

- `ids`: AdvisoryId[]
- `title`: string
- `severity`: Severity
- `summary`: string | null
- `url`: string | null
- `fixedIn`: string[] | null
- `publishedAt`: string | null (ISO)

### Occurrence

- `package`: PackageRef
- `kind`: DependencyKind
- `manifestPath`: string (workspace-relative or absolute normalized)
- `lockfilePath`: string | null
- `dependencyPath`: string[] (root → … → package)
- `manifestLocator`: optional hint for UI (`packageName`, `section`, `line`, `charStart`, `charEnd`)

### FixHint

- `type`: `update` | `replace` | `remove` | `none` | `unknown`
- `message`: string
- `suggestedVersion`: string | null
- `commandHint`: string | null (text suggestion only; host may copy)

### Finding

- `id`: string (stable within scan)
- `vulnerability`: Vulnerability
- `occurrence`: Occurrence
- `fix`: FixHint | null
- `scanner`: string (e.g. `npm-manifest`, `osv`)

### IgnoreRule

- `id`: string
- `advisory`: string | null
- `packageName`: string | null
- `ecosystem`: Ecosystem | null
- `reason`: string | null
- `expiresAt`: string | null (ISO)
- `createdAt`: string

### Policy

- `minSeverity`: Severity
- `enabledEcosystems`: Ecosystem[] | `all`
- `directOnly`: boolean
- `allowNetwork`: boolean
- `ignores`: IgnoreRule[]
- `timeoutMs`: number

### ScanRequest

- `roots`: string[] (directories to consider)
- `policy`: Policy
- `signal`: AbortSignal | null (cancel support)
- `now`: Date | undefined (optional clock for expiry tests)

### ScanIssue

- `code`: string (see errors.md)
- `message`: string
- `path`: string | null
- `ecosystem`: Ecosystem | null
- `retriable`: boolean

### ScanResult

- `apiVersion`: string (e.g. `"1"`)
- `status`: ScanStatus
- `scannedAt`: string (ISO)
- `roots`: string[]
- `findings`: Finding[]
- `issues`: ScanIssue[]
- `stats`: `{ bySeverity: Record<Severity, number>; findingCount: number; cacheHit: boolean }`
- `meta`: `{ engineVersion: string; scannersUsed: string[] }`

## Invariants

1. Findings exposed to hosts are already filtered by `minSeverity` and active ignores.
2. `version` on PackageRef should be **resolved** when a lockfile exists.
3. Engine never mutates user manifests/lockfiles.
4. Engine never executes package install/upgrade commands.
5. Same `Policy` + same file hashes ⇒ cache-eligible identical logical result.
