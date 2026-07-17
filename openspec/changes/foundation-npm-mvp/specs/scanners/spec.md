## ADDED Requirements

### Requirement: Scanner port
The engine SHALL define a `Scanner` interface with a stable `id` (e.g. `npm-manifest`, `osv`), `supports(detection): boolean`, and `scan(ctx: ScannerContext): Promise<ScannerRawResult>`. `ScannerContext` SHALL provide `root`, `manifests`, `lockfiles`, `policy`, `signal`, `runCommand`, and `fetchImpl`. `ScannerRawResult` SHALL contain `findings: Finding[]`, `issues: ScanIssue[]`, and `scannersUsed: string[]`.

#### Scenario: Orchestrator selects a supporting scanner
- **WHEN** detection reports an npm root and the orchestrator asks each scanner `supports(detection)`
- **THEN** the npm manifest parser and the OSV adapter each report support for that detection

### Requirement: Adapters return normalized, unfiltered findings
Scanner adapters SHALL translate external formats into domain `Finding` objects inside the adapter and SHALL return them WITHOUT applying `minSeverity` or ignore filtering. Policy SHALL be applied exactly once, by the orchestrator.

#### Scenario: Adapter does not filter by severity
- **WHEN** the OSV adapter receives a `low` and a `high` vulnerability for the same package
- **THEN** it emits both as `Finding` objects and leaves filtering to `applyPolicy`

### Requirement: npm manifest parser adapter
The engine SHALL include an `npm-manifest` scanner that parses `package.json` (and JSONC) via `jsonc-parser` into an AST and emits one `Finding`-shaped `Occurrence` per dependency with editor location data (`line`, `charStart`, `charEnd`) stored in `Occurrence.manifestLocator`. It SHALL traverse `dependencies`, `devDependencies`, `optionalDependencies`, and `peerDependencies`. Version strings SHALL be cleaned of range prefixes (`^`, `~`, `>=`, etc.) before being passed downstream.

#### Scenario: Dependency locations are exact
- **WHEN** the parser processes a `package.json` containing `"lodash": "^4.17.19"`
- **THEN** it records the cleaned version `4.17.19` and `line`/`charStart`/`charEnd` that point exactly at the version string in the source text

#### Scenario: All dependency sections are covered
- **WHEN** the parser processes a `package.json` with entries in `dependencies`, `devDependencies`, `optionalDependencies`, and `peerDependencies`
- **THEN** it emits occurrences for entries in all four sections

#### Scenario: Malformed manifest is fail-soft
- **WHEN** the parser is given a `package.json` that is not valid JSON/JSONC
- **THEN** it returns no findings and a `PARSE_FAILED` `ScanIssue` instead of throwing

### Requirement: OSV vulnerability adapter
The engine SHALL include an `osv` scanner that queries `https://api.osv.dev/v1/query` for each package@version and maps responses to domain `Finding` objects with `scanner: "osv"`. It SHALL use the `fetchImpl` from `ScannerContext` (defaulting to global `fetch`). It SHALL map upstream severities through the `medium → moderate` alias.

#### Scenario: OSV vulnerability is normalized
- **WHEN** OSV returns a vulnerability for `lodash@4.17.19` with severity `HIGH`
- **THEN** the adapter emits a `Finding` whose `vulnerability.severity` is `high` and whose `scanner` is `"osv"`

#### Scenario: Clean package returns no findings
- **WHEN** OSV returns no vulnerabilities for a package@version
- **THEN** the adapter emits zero findings for that package and no issue

### Requirement: allowNetwork gate
The OSV adapter SHALL skip all network calls when `policy.allowNetwork` is false and SHALL emit a single `NETWORK_DISABLED` `ScanIssue` (not per-package). When network calls fail, the adapter SHALL emit a `NETWORK_FAILED` issue and return any partial findings already gathered.

#### Scenario: Network disabled skips OSV
- **WHEN** a scan runs with `policy.allowNetwork = false`
- **THEN** the OSV adapter makes zero network calls and the `ScanResult` includes a `NETWORK_DISABLED` issue

#### Scenario: Network failure is fail-soft
- **WHEN** an OSV request fails mid-scan
- **THEN** the adapter emits a `NETWORK_FAILED` issue and the scan resolves with `status: "degraded"` plus any findings gathered before the failure

### Requirement: Adapters must fail soft, never throw for operational problems
Scanner adapters SHALL NOT throw for operational problems (parse failure, network failure, timeout). Such conditions SHALL become `ScanIssue` entries. Adapters SHALL throw only for programmer misuse.

#### Scenario: Timeout becomes an issue
- **WHEN** an OSV request exceeds `policy.timeoutMs`
- **THEN** the adapter emits a `TIMEOUT` issue rather than throwing
