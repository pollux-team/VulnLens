## MODIFIED Requirements

### Requirement: Inline dependency health decorations
The system SHALL show health status as inline decorations at the end of each dependency line in package.json, including CVSS vulnerability scores.

#### Scenario: Package on latest version with no vulnerabilities
- **WHEN** a dependency is on the latest version and has no known vulnerabilities
- **THEN** displays `// ✓ latest` in green at the end of the line

#### Scenario: Package on latest version with vulnerabilities
- **WHEN** a dependency is on the latest version but has known vulnerabilities
- **THEN** displays `// ✓ latest CVSS 7.5` with the score colored by severity

#### Scenario: Newer version available
- **WHEN** a newer version is available
- **THEN** displays `// ↗ X.Y.Z CVSS N.N` in blue at the end of the line

#### Scenario: Deprecated package
- **WHEN** a dependency is deprecated
- **THEN** displays `// ⚠ deprecated` in red at the end of the line

#### Scenario: Unknown vulnerability status
- **WHEN** vulnerability data cannot be retrieved
- **THEN** displays `// ✓ latest` or `// ↗ X.Y.Z` without a CVSS score

### Requirement: Health check triggers
The system SHALL run health checks when a package.json is opened, saved, or becomes the active editor.

#### Scenario: Open package.json
- **WHEN** a package.json file is opened in the editor
- **THEN** health decorations appear within 500ms

#### Scenario: Save package.json
- **WHEN** a package.json file is saved
- **THEN** health decorations refresh with updated data

#### Scenario: Switch to package.json tab
- **WHEN** the user switches to a package.json tab
- **THEN** health decorations appear for that file
