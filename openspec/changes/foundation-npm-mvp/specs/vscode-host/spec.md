## ADDED Requirements

### Requirement: vulnlens.scan command
The extension SHALL contribute a `vulnlens.scan` command that runs the engine over the workspace (or current package root) and refreshes Diagnostics and the Status Bar from the returned `ScanResult`.

#### Scenario: Command triggers a scan
- **WHEN** the user runs `vulnlens.scan`
- **THEN** the extension calls `engine.scan()` with a `ScanRequest` built from workspace roots and the current `Policy`, and updates Diagnostics from `result.findings`

### Requirement: Configuration to Policy mapping
The extension SHALL read configuration keys `vulnlens.minSeverity`, `vulnlens.autoScanOnOpen`, and `vulnlens.allowNetwork` and convert them into an engine `Policy`. The mapping SHALL live in the `vscode` package, not in the engine. Default `minSeverity` SHALL be `moderate`; default `autoScanOnOpen` SHALL be `true`; default `allowNetwork` SHALL be `true`.

#### Scenario: Settings map to Policy
- **WHEN** `vulnlens.minSeverity` is set to `"high"` and `vulnlens.allowNetwork` to `false`
- **THEN** the `Policy` passed to `scan()` has `minSeverity: "high"` and `allowNetwork: false`

### Requirement: Diagnostics from findings
The extension SHALL map each `Finding.occurrence` location data to a VS Code `Range` on the corresponding `package.json` and create a `Diagnostic` whose severity reflects the finding's `Vulnerability.severity`. The Diagnostics count SHALL equal the engine findings count for the same policy. The extension SHALL NOT parse OSV/audit JSON itself or re-rank severities.

#### Scenario: Diagnostics match engine findings
- **WHEN** a scan returns N findings for a `package.json`
- **THEN** exactly N Diagnostics are produced on that file, one per finding, at the finding's location

#### Scenario: No findings yields no diagnostics
- **WHEN** a scan returns zero findings for a `package.json`
- **THEN** the extension clears all VulnLens Diagnostics for that file

### Requirement: Status Bar severity counts
The extension SHALL show a Status Bar item summarizing findings by severity (e.g. counts of critical/high/moderate) and the overall scan status. When `status` is `degraded` or `failed`, the item SHALL indicate degraded mode (e.g. due to network disabled/failure).

#### Scenario: Status bar reflects counts
- **WHEN** a scan returns 2 high and 1 moderate findings
- **THEN** the Status Bar item shows counts that include 2 high and 1 moderate

#### Scenario: Degraded mode is surfaced
- **WHEN** a scan resolves with `status: "degraded"` due to `NETWORK_DISABLED`
- **THEN** the Status Bar item indicates degraded/network-disabled mode

### Requirement: Workspace Trust gate
The extension SHALL NOT auto-scan in untrusted workspaces. On an untrusted workspace, auto-scan SHALL be suppressed and a host-side `WORKSPACE_UNTRUSTED` `ScanIssue` SHALL be surfaced (e.g. in the Status Bar/output). Manual `vulnlens.scan` in an untrusted workspace SHALL also be refused unless the user explicitly trusts the workspace.

#### Scenario: Auto-scan suppressed when untrusted
- **WHEN** the workspace is untrusted and a `package.json` is opened
- **THEN** no scan runs automatically and the user is informed that the workspace must be trusted

### Requirement: Progress and cancellation
The extension SHALL show progress UI for scans and SHALL convert the VS Code `CancellationToken` to an `AbortSignal` passed as `request.signal`. Canceling the progress SHALL abort the scan best-effort.

#### Scenario: Cancel aborts the scan
- **WHEN** the user cancels the scan progress
- **THEN** `request.signal` is aborted and the engine resolves with a `CANCELLED` issue and partial findings

### Requirement: Host must not mutate manifests
The extension SHALL NOT write vulnerability comments or any other annotations into on-disk `package.json` or lockfiles. All annotations are rendered via editor surfaces (Diagnostics, decorations) only.

#### Scenario: Disk is untouched
- **WHEN** a scan finds vulnerabilities in `package.json`
- **THEN** the file on disk is unchanged (verified by comparing file content/hash before and after)

### Requirement: Host depends on engine contract only
The `vscode` package SHALL import `@vulnlens/engine` public exports and `vscode` only. It SHALL NOT import scanner-internal modules or raw OSV/npm audit types.

#### Scenario: No deep engine imports
- **WHEN** the `vscode` package source is inspected
- **THEN** all engine imports come from the package root (`@vulnlens/engine`), never from `@vulnlens/engine/scanners/*` internals
