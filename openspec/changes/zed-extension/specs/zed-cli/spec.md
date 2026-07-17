## ADDED Requirements

### Requirement: CLI scan command
The CLI SHALL accept a `scan` command that scans a project directory for vulnerabilities.

#### Scenario: Scan project with vulnerabilities
- **WHEN** `vulnens-cli scan /path/to/project` is run
- **THEN** outputs JSON to stdout with `{ status, findings: [{ package, severity, cvss, title, fix }], stats: { total, bySeverity } }`

#### Scenario: Scan with severity filter
- **WHEN** `vulnens-cli scan /path/to/project --min-severity high` is run
- **THEN** only returns findings with severity high or critical

#### Scenario: Offline scan
- **WHEN** `vulnens-cli scan /path/to/project --no-network` is run
- **THEN** returns `status: "degraded"` with `NETWORK_DISABLED` issue

### Requirement: CLI health command
The CLI SHALL accept a `health` command that checks dependency health.

#### Scenario: Health check
- **WHEN** `vulnens-cli health /path/to/package.json` is run
- **THEN** outputs JSON with `[{ name, currentVersion, latest, cvssScore, deprecated, versions }]`

### Requirement: JSON output format
The CLI SHALL output valid JSON to stdout. Errors SHALL be output to stderr.

#### Scenario: Successful run
- **WHEN** the command succeeds
- **THEN** stdout contains valid JSON, exit code is 0

#### Scenario: Error
- **WHEN** the command fails (missing file, network error)
- **THEN** stderr contains error message, exit code is 1
