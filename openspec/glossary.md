# VulnLens — Glossary

## Enums

### Severity

Ordered: `low` < `moderate` < `high` < `critical`

Alias mapping: npm/OSV `medium` → `moderate`.

### Ecosystem

Extensible set: `npm` | `yarn` | `pnpm` | `pypi` | `crates` | `go` | `rubygems` | `packagist` | `unknown`

### DependencyKind

`direct` | `transitive`

### ScanStatus

`ok` | `degraded` | `failed`

## Core Objects

### PackageRef

A reference to a specific package: `ecosystem`, `name`, `version` (resolved preferred), `purl`, `range` (manifest range).

### AdvisoryId

A vulnerability identifier: `system` (`cve` | `ghsa` | `osv` | `other`) + `value` (string).

### Vulnerability

A known security flaw: `ids` (AdvisoryId[]), `title`, `severity`, `summary`, `url`, `fixedIn`, `publishedAt`.

### Occurrence

Where a dependency appears: `package` (PackageRef), `kind` (DependencyKind), `manifestPath`, `lockfilePath`, `dependencyPath`, `manifestLocator` (editor location hint).

### FixHint

How to resolve: `type` (`update` | `replace` | `remove` | `none` | `unknown`), `message`, `suggestedVersion`, `commandHint`.

### Finding

A single vulnerability occurrence: `id`, `vulnerability`, `occurrence`, `fix`, `scanner`.

### IgnoreRule

A suppression rule: `id`, `advisory`, `packageName`, `ecosystem`, `reason`, `expiresAt`, `createdAt`.

### Policy

Configuration for filtering: `minSeverity`, `enabledEcosystems`, `directOnly`, `allowNetwork`, `ignores`, `timeoutMs`.

### ScanRequest

Input to `scan()`: `roots`, `policy`, `signal`, `now`.

### ScanIssue

A non-finding problem: `code`, `message`, `path`, `ecosystem`, `retriable`.

### ScanResult

Output of `scan()`: `apiVersion`, `status`, `scannedAt`, `roots`, `findings`, `issues`, `stats`, `meta`.

## Terms

### Scanner

A pluggable adapter that detects ecosystems and queries vulnerability data.

### Orchestrator

The engine component that coordinates detect → scan → normalize → policy → cache → return.

### Host

A presentation adapter (VS Code, CLI) that renders `ScanResult` for users.

### Engine

The central host-agnostic core that owns truth (findings, severity, ignores, cache).
