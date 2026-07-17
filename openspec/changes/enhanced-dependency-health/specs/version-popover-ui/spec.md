## ADDED Requirements

### Requirement: Version history popover
The system SHALL display a webview panel showing version history when the user clicks on an inline health decoration.

#### Scenario: Popover opens on click
- **WHEN** user clicks the inline `// ↗ 3.5.0` decoration for a package
- **THEN** a webview panel opens beside the editor showing version history for that package

#### Scenario: Popover content
- **WHEN** the popover is displayed
- **THEN** it shows: package name, current installed version, last 5 versions with CVSS scores, latest version highlighted, and a "Update to latest" button

#### Scenario: Version with vulnerabilities
- **WHEN** a version has known vulnerabilities
- **THEN** the CVSS score is displayed with severity color (red for critical/high, orange for moderate, green for low)

#### Scenario: Version without vulnerabilities
- **WHEN** a version has no known vulnerabilities
- **THEN** a green checkmark is shown next to the version

### Requirement: Update dependency version
The system SHALL allow users to update a dependency version from the popover.

#### Scenario: Click update button
- **WHEN** user clicks "Update to X.Y.Z" in the popover
- **THEN** the version string in package.json is replaced with the new version

#### Scenario: Update confirmation
- **WHEN** a version is successfully updated
- **THEN** a notification shows "Updated <package> to <version>"
