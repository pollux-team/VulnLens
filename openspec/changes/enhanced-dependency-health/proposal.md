## Why

The current dependency health feature shows basic inline status (✓ latest, ↗ version, ⚠ deprecated) but lacks vulnerability context. Developers need to see CVE scores directly inline next to each dependency and access detailed version history with vulnerability data in a popover — without leaving the editor.

## What Changes

- Add CVSS vulnerability scores to inline dependency health decorations
- Show package name alongside the score inline (e.g., `// ✓ latest CVSS 3.1`)
- Create a clickable version popover/webview when clicking the inline status
- Popover displays: last 5 versions, current installed version, CVSS scores per version, and fix recommendations
- Move npm registry queries to the engine core for reuse across hosts
- Cache registry responses to avoid redundant API calls

## Capabilities

### New Capabilities
- `dependency-health-advisor`: Core engine module for querying npm registry, resolving version histories, and computing per-version vulnerability scores
- `version-popover-ui`: VS Code webview panel showing version history, CVSS scores, and upgrade recommendations in a compact modal

### Modified Capabilities
- `vscode-host`: Enhanced inline decorations with CVSS scores; new click handler for version popover; integration with dependency-health-advisor

## Impact

- **New code**: `packages/engine/src/health/` (advisor core), `packages/vscode/src/version-popover.ts` (webview)
- **Modified code**: `packages/vscode/src/health-decorations.ts`, `packages/vscode/src/extension.ts`, `packages/vscode/src/dependency-health.ts`
- **New dependencies**: None (uses existing `fetch` and OSV API)
- **Public API**: Engine exports `checkPackageHealth()`, `fetchVersionHistory()`, `queryVulnerabilityScores()`
- **Performance**: Registry responses cached in-memory with 5-minute TTL; batch queries for multiple packages
