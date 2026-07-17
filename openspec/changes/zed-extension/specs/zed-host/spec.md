## ADDED Requirements

### Requirement: Spawn CLI sidecar
The Zed extension SHALL spawn the `vulnens-cli` process and read its JSON output.

#### Scenario: Extension loads
- **WHEN** Zed loads the VulnLens extension
- **THEN** the extension verifies `vulnens-cli` is available (checks PATH or bundled location)

#### Scenario: CLI not found
- **WHEN** `vulnens-cli` is not installed
- **THEN** shows an error notification: "VulnLens requires Node.js. Install from https://nodejs.org"

### Requirement: Diagnostic annotations
The extension SHALL show vulnerability diagnostics in Zed's Problems panel.

#### Scenario: Vulnerable dependency found
- **WHEN** scan finds a vulnerable dependency at line 10 of package.json
- **THEN** a diagnostic appears at line 10 with severity mapped from CVSS (critical→error, high→warning, moderate→info, low→hint)

#### Scenario: Deprecated package
- **WHEN** scan finds a deprecated package
- **THEN** a diagnostic appears with warning severity and message "Package is deprecated"

### Requirement: Slash command
The extension SHALL register a `/vulnens-scan` slash command for the AI Assistant.

#### Scenario: User runs slash command
- **WHEN** user types `/vulnens-scan` in the AI Assistant
- **THEN** runs the scan and returns a markdown summary of findings

#### Scenario: Slash command with severity filter
- **WHEN** user types `/vulnens-scan high`
- **THEN** only shows high and critical findings in the summary

### Requirement: Manual scan trigger
The extension SHALL provide a command to trigger a manual scan.

#### Scenario: User runs command
- **WHEN** user runs "VulnLens: Scan Workspace" from the command palette
- **THEN** scans the current workspace and updates diagnostics
