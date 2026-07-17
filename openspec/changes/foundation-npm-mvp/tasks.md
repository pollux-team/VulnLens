## 1. Repo skeleton & tooling

- [x] 1.1 Create root `package.json` (pnpm workspace root, private, scripts for typecheck/test/build)
- [x] 1.2 Create `pnpm-workspace.yaml` pointing to `packages/*`
- [x] 1.3 Create `tsconfig.base.json` (strict, ESNext, moduleResolution bundler/node16)
- [x] 1.4 Create `.gitignore` (node_modules, dist, .vscode-test, coverage)
- [x] 1.5 Scaffold `packages/engine` (`package.json` named `@vulnlens/engine`, `tsconfig.json` extending base)
- [x] 1.6 Scaffold `packages/vscode` (`package.json` with `engines.vscode`, contribution stubs, `tsconfig.json`)
- [x] 1.7 Scaffold `packages/cli` stub (`package.json` + `README.md` only, reserved for later)
- [x] 1.8 Add Vitest config at root and in `packages/engine`
- [x] 1.9 Add `packages/vscode/esbuild.js` bundler config and build script
- [x] 1.10 Add `.github/workflows/ci.yml` running typecheck + tests (initial, can be minimal)

## 2. OpenSpec project docs & ADRs

- [x] 2.1 Write `openspec/project.md` (overview, non-goals, default policy table, success metrics from Section 1 & 14)
- [x] 2.2 Write `openspec/glossary.md` (all domain enums/objects from Section 5)
- [x] 2.3 Write `openspec/architecture.md` (host→engine→scanners diagram + ownership/boundary table)
- [x] 2.4 Write `openspec/security.md` (threat model + MUST list: no manifest mutation, no install execution, allowlist, workspace trust, no secrets in logs)
- [x] 2.5 Write ADR-001 no manifest mutation (Context/Decision/Consequences)
- [x] 2.6 Write ADR-002 lockfile source of truth
- [x] 2.7 Write ADR-003 normalized model
- [x] 2.8 Write ADR-004 central engine (hosts presentation-only)
- [x] 2.9 Write ADR-005 default severity moderate
- [x] 2.10 Write ADR-006 workspace trust
- [x] 2.11 Write ADR-007 TypeScript core
- [x] 2.12 Write ADR-008 npm-audit + OSV (OSV-first for MVP, npm audit later)

## 3. docs/core contract

- [x] 3.1 Write `docs/core/README.md` (maintenance rules, doc/code sync policy, link index)
- [x] 3.2 Write `docs/core/overview.md` (engine responsibilities & non-responsibilities, diagram)
- [x] 3.3 Write `docs/core/domain-model.md` (all types, enums, invariants from Section 5)
- [x] 3.4 Write `docs/core/api.md` (createEngine, scan, detect, applyPolicy, getSeverityRank, ENGINE_API_VERSION, guarantees)
- [x] 3.5 Write `docs/core/scanners.md` (Scanner port, adapter rules, registry of scanner ids)
- [x] 3.6 Write `docs/core/policy.md` (minSeverity, allowNetwork, host mapping note; mark ignores/directOnly as deferred)
- [x] 3.7 Write `docs/core/cache.md` (key material, CacheStore port, no-cache-failed rule)
- [x] 3.8 Write `docs/core/errors.md` (stable ScanIssue.code list + degraded vs failed)
- [x] 3.9 Write `docs/core/versioning.md` (Engine API v1 policy, breaking-change process)
- [x] 3.10 Write `docs/hosts/vscode.md` (allowed/forbidden, commands, config keys, trust gate)

## 4. Engine core: domain types & public surface

- [x] 4.1 Implement `packages/engine/src/types/` domain model exactly matching `docs/core/domain-model.md` (Severity, Ecosystem, DependencyKind, ScanStatus, PackageRef, AdvisoryId, Vulnerability, Occurrence, FixHint, Finding, IgnoreRule, Policy, ScanRequest, ScanIssue, ScanResult, manifestLocator)
- [x] 4.2 Export `ENGINE_API_VERSION = "1"` and all public types from `packages/engine/src/index.ts`
- [x] 4.3 Implement severity alias map (`medium → moderate`) and `getSeverityRank()`
- [x] 4.4 Define `EngineOptions`, `VulnLensEngine`, `createEngine()` factory (wires injectable scanners/cache/clock/fetchImpl/logger)
- [x] 4.5 Add `zod` schemas for external JSON (npm manifest, OSV response) validated in adapters

## 5. Engine: detect, orchestrator, policy, cache

- [x] 5.1 Implement `detect(roots)` returning `DetectionResult` (find `package.json`; note `package-lock.json` when present)
- [x] 5.2 Implement the orchestrator `scan(ScanRequest)`: detect → select scanners → run → merge → normalize → applyPolicy → cache read/write → return `ScanResult`
- [x] 5.3 Implement fail-soft behavior: operational failures become `ScanIssue` (codes: NETWORK_DISABLED, NETWORK_FAILED, PARSE_FAILED, TIMEOUT, CANCELLED, UNSUPPORTED_ECOSYSTEM, INTERNAL); throw only on programmer misuse
- [x] 5.4 Implement cancellation: honor `request.signal` (AbortSignal) best-effort, emit `CANCELLED` issue + partial findings
- [x] 5.5 Implement `applyPolicy(findings, policy)` pure function: minSeverity gate (MVP); allowNetwork semantics
- [x] 5.6 Implement in-memory LRU cache (`lru-cache`): key = ENGINE_API_VERSION + policy fingerprint + sorted content hashes of manifests in scope + scanner id/version; set `stats.cacheHit`; never cache `status: failed`
- [x] 5.7 Assemble `ScanResult` with `stats.bySeverity`, `stats.findingCount`, `meta.engineVersion`, `meta.scannersUsed`, fresh `scannedAt` on cache hit

## 6. Scanners: port + npm parser + OSV adapter

- [x] 6.1 Define `Scanner`, `ScannerContext`, `ScannerRawResult` in `packages/engine/src/scanners/types.ts`
- [x] 6.2 Implement npm manifest parser scanner (`id: "npm-manifest"`) using `jsonc-parser` AST: traverse dependencies/devDependencies/optionalDependencies/peerDependencies, compute line/charStart/charEnd, clean version prefixes, emit Occurrences with manifestLocator
- [x] 6.3 Make npm parser fail-soft: return `PARSE_FAILED` issue on invalid JSON/JSONC instead of throwing
- [x] 6.4 Implement OSV adapter (`id: "osv"`): query `https://api.osv.dev/v1/query` per package@version via `fetchImpl`, map responses to domain `Finding` with `scanner: "osv"`, apply `medium → moderate` alias
- [x] 6.5 Implement `allowNetwork` gate in OSV adapter: skip all calls + emit single `NETWORK_DISABLED` issue when false; emit `NETWORK_FAILED` on request failure with partial findings
- [x] 6.6 Implement timeout handling: emit `TIMEOUT` issue when `policy.timeoutMs` exceeded
- [x] 6.7 Ensure adapters return unfiltered normalized findings (no minSeverity/ignore filtering)

## 7. VS Code adapter

- [x] 7.1 Scaffold `packages/vscode/src/extension.ts` activation + "VulnLens ready" log
- [x] 7.2 Contribute `vulnlens.scan` command in `package.json`
- [x] 7.3 Contribute configuration keys `vulnlens.minSeverity`, `vulnlens.autoScanOnOpen`, `vulnlens.allowNetwork` with defaults (moderate / true / true)
- [x] 7.4 Implement config → `Policy` mapping in `src/config/` (lives in vscode package, not engine)
- [x] 7.5 Implement `CancellationToken` → `AbortSignal` bridge for scan requests
- [x] 7.6 Implement `src/mapping/` to map `Finding.occurrence` location data → VS Code `Range` on `package.json`
- [x] 7.7 Implement Diagnostics provider: one Diagnostic per finding, severity from `Vulnerability.severity`; clear diagnostics when zero findings
- [x] 7.8 Implement Status Bar item: counts by severity + degraded/failed indicator
- [x] 7.9 Implement progress UI for scans with cancellation
- [x] 7.10 Implement Workspace Trust gate: suppress auto-scan on untrusted workspaces, surface `WORKSPACE_UNTRUSTED`
- [x] 7.11 Implement auto-scan on open (trusted workspaces only, debounced)

## 8. Tests, fixtures & boundary enforcement

- [x] 8.1 Add engine fixtures: `tests/fixtures/` with vulnerable `package.json`, clean `package.json`, malformed JSON, JSONC-with-comments
- [x] 8.2 Engine unit tests: npm parser locations exact across all four dependency sections
- [x] 8.3 Engine unit tests: OSV adapter normalization (medium→moderate, severity mapping, clean package = no findings) using injected `fetchImpl`
- [x] 8.4 Engine unit tests: `applyPolicy` minSeverity filtering
- [x] 8.5 Engine unit tests: `scan()` returns findings as data (no throw), degraded/failed statuses, CANCELLED on abort
- [x] 8.6 Engine unit tests: cache hit on repeat scan; failed results not cached
- [x] 8.7 Engine unit tests: `allowNetwork=false` skips OSV and emits `NETWORK_DISABLED`; network failure is fail-soft
- [x] 8.8 Boundary test: assert no `vscode` import under `packages/engine/src`
- [x] 8.9 Boundary enforcement: configure `packages/engine/tsconfig.json` path restrictions to forbid `vscode`
- [x] 8.10 VS Code mapping tests: assert Diagnostic ranges against fixture text; assert Diagnostics count === findings count

## 9. Docs sync & final verification

- [x] 9.1 Verify `docs/core/api.md` and `domain-model.md` match the implemented public exports
- [x] 9.2 Verify `docs/core/scanners.md` lists `npm-manifest` and `osv` scanner ids
- [x] 9.3 Verify `docs/core/errors.md` lists all ScanIssue codes emitted by the implementation
- [x] 9.4 Run `pnpm typecheck` across all packages and fix any errors
- [x] 9.5 Run `pnpm test` and ensure all engine + boundary tests pass
- [x] 9.6 Manual QA: open `samples/npm-moderate/package.json` in VS Code, run `vulnlens.scan`, confirm moderate+ Diagnostics appear, Status Bar shows counts, disk file unchanged
- [x] 9.7 Add `samples/npm-moderate/` and `samples/npm-clean/` demo projects for manual QA
