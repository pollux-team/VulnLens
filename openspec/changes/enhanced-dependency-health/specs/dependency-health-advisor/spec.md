## ADDED Requirements

### Requirement: Fetch npm registry metadata
The system SHALL query the npm registry for package metadata including latest version, deprecated status, and version history.

#### Scenario: Successful registry query
- **WHEN** `fetchNpmMetadata("react")` is called
- **THEN** returns `{ latest: "18.3.1", deprecated: false, deprecationMsg: null, versions: ["18.3.1", "18.3.0", ...] }`

#### Scenario: Package not found
- **WHEN** `fetchNpmMetadata("nonexistent-pkg-xyz")` is called
- **THEN** returns `{ latest: null, deprecated: false, deprecationMsg: null, versions: [] }`

#### Scenario: Network failure
- **WHEN** the npm registry is unreachable
- **THEN** returns `{ latest: null, deprecated: false, deprecationMsg: null, versions: [] }` without throwing

### Requirement: Query OSV for per-version vulnerability scores
The system SHALL query the OSV API for CVSS scores of specific package versions.

#### Scenario: Vulnerability found for version
- **WHEN** `queryVulnerabilityScores("lodash", ["4.17.15", "4.17.21"])` is called
- **THEN** returns `{ "4.17.15": [{ score: 7.5, severity: "high", title: "Prototype Pollution" }], "4.17.21": [] }`

#### Scenario: No vulnerabilities
- **WHEN** querying a package with no known vulnerabilities
- **THEN** returns an empty array for each version

#### Scenario: Batch query
- **WHEN** querying multiple packages at once
- **THEN** uses OSV batch endpoint `/v1/querybatch` to minimize round-trips

### Requirement: Cache registry responses
The system SHALL cache npm registry responses in memory with a 5-minute TTL.

#### Scenario: Cache hit
- **WHEN** the same package is queried within 5 minutes of a previous query
- **THEN** returns the cached response without making a network request

#### Scenario: Cache expiry
- **WHEN** a cached response is older than 5 minutes
- **THEN** the next query fetches fresh data from the registry

### Requirement: Check package health
The system SHALL provide a unified function that returns health status for all dependencies in a manifest.

#### Scenario: Full health check
- **WHEN** `checkPackageHealth("/path/to/package.json")` is called
- **THEN** returns an array of objects with `{ name, currentVersion, section, lineNumber, latest, deprecated, deprecationMsg, cvssScore, vulnerabilities }` for each dependency

#### Scenario: Non-package.json file
- **WHEN** called with a path that doesn't end in `package.json`
- **THEN** returns an empty array
