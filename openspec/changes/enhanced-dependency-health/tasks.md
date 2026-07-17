## 1. Engine Core — Health Advisor

- [x] 1.1 Create `packages/engine/src/health/` directory with `registry.ts`, `vulnerability.ts`, `advisor.ts`
- [x] 1.2 Implement `fetchNpmMetadata(name)` — query npm registry, return latest, deprecated, versions array
- [x] 1.3 Implement LRU cache with 5-minute TTL for registry responses
- [x] 1.4 Implement `queryVulnerabilityScores(name, versions)` — batch OSV queries for CVSS scores per version
- [x] 1.5 Implement `checkPackageHealth(manifestPath)` — combine registry + vulnerability data, return per-dependency health objects
- [x] 1.6 Export health advisor functions from `packages/engine/src/index.ts`
- [x] 1.7 Write unit tests for registry queries, caching, vulnerability scoring, and health check

## 2. VS Code — Enhanced Inline Decorations

- [x] 2.1 Update `health-decorations.ts` to include CVSS scores in inline text (e.g., `// ↗ 3.5.0 CVSS 7.5`)
- [x] 2.2 Color-code CVSS scores by severity in decorations (red/orange/green)
- [x] 2.3 Handle missing vulnerability data gracefully (show `// ✓ latest` without score)

## 3. VS Code — Version Popover

- [x] 3.1 Create `version-popover.ts` webview panel showing package name, current version, last 5 versions
- [x] 3.2 Display CVSS scores per version with severity-colored badges in the popover
- [x] 3.3 Add "Update to X.Y.Z" button that replaces the version in package.json
- [x] 3.4 Show fix recommendations from OSV data in the popover
- [x] 3.5 Register `vulnlens.showVersionHistory` command and wire click handler from decorations

## 4. VS Code — Extension Integration

- [x] 4.1 Update `extension.ts` to import and use the engine health advisor instead of local `dependency-health.ts`
- [x] 4.2 Remove old `dependency-health.ts` from vscode package (logic moved to engine)
- [x] 4.3 Wire version popover command to decoration click events
- [x] 4.4 Update `package.json` commands with new `vulnlens.showVersionHistory` command

## 5. Testing & Polish

- [x] 5.1 Write tests for version popover webview HTML generation
- [x] 5.2 Write tests for decoration rendering with CVSS scores
- [x] 5.3 Verify `pnpm typecheck` passes across all packages
- [x] 5.4 Verify `pnpm test` passes (all existing + new tests)
- [ ] 5.5 Manual test: open a package.json with known vulnerable deps, verify inline scores and popover
