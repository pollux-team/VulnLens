## Context

Greenfield repository: no packages, no contract docs, no ADRs exist yet. Two source blueprints were merged for this change — the VulnLens "single source of truth" (contract/docs/ADR base, `scan(ScanRequest)` API, lockfile-as-truth, 8 ADRs, `docs/core` maintenance rules) and the VulnLense implementation blueprint (hexagonal engine, OSV-first scanning, `jsonc-parser` manifest parsing with editor location data, `lru-cache`). Where they conflict, the VulnLens contract wins; where VulnLense adds a concrete mechanism that does not conflict (OSV-first MVP, AST-based locations, LRU cache), it is adopted.

Stakeholders: developers editing `package.json` in VS Code/Cursor (primary user); future host authors (CLI/CI) who depend only on the engine contract. Constraints: TypeScript strict, Node.js LTS, pnpm workspaces, no on-disk manifest mutation, no install/upgrade execution, no telemetry in v1.

## Goals / Non-Goals

**Goals:**
- Establish the durable contract (`docs/core`, OpenSpec project docs, ADRs 001–008) before breadth.
- Scaffold the monorepo with enforceable package boundaries (`engine` ↛ `vscode`).
- Prove the central-engine architecture end-to-end with one vertical slice: npm manifest → OSV → Diagnostics + Status Bar.
- Define Engine API v1 (`ScanResult`, `scan(ScanRequest)`, `createEngine`) and the Scanner port.
- Make the VS Code adapter presentation-only: it maps `Finding.occurrence` to editor ranges and renders UI; it never parses OSV/audit JSON or ranks severity itself.

**Non-Goals:**
- `npm audit --json` spawning (deferred; OSV is the MVP intel source).
- Lockfile-resolved version parsing (`package-lock.json`/`yarn.lock`/`pnpm-lock`) — best-effort awareness only this phase; resolved versions deferred.
- Full policy: ignore rules with expiry, `directOnly`, `enabledEcosystems` beyond npm — deferred to a later change.
- Tree view, webview report, SARIF, CLI, additional ecosystems (Python/Go/yarn/pnpm).
- Cache persistence to `workspaceState` (in-memory only this phase).

## Decisions

**D1 — Central engine + thin hosts (hexagonal).** Engine owns detect/scan/normalize/policy/cache/report-shape; hosts own presentation only. *Why:* lets the same engine power VS Code now and CLI/CI later without rewriting findings logic. *Alternative:* per-host scanning — rejected (duplicated severity/merge logic, drift).

**D2 — OSV-first for the MVP, not `npm audit`.** Query `https://api.osv.dev/v1/query` with cleaned `package@version` from the manifest. *Why:* no process spawn, cross-ecosystem, works without a lockfile, single normalization path. *Alternative:* `npm audit --json` — rejected for MVP (Node-only, requires lockfile + spawn, allowlist surface). `npm audit` stays on the roadmap as a later scanner. *Trade-off:* querying by manifest range/version (not lockfile-resolved) is noisier — accepted for the slice; lockfile-resolved versions are a documented follow-up.

**D3 — `scan(ScanRequest)` API over `scanDocument(fileName, text)`.** Request carries `roots`, `policy`, `signal`, optional `now`. *Why:* host-agnostic (not file-text-bound), cacheable by content hash, cancellation-native, policy-explicit. The VulnLense location data (`line`, `charStart`, `charEnd`) is preserved inside `Occurrence.manifestLocator` so the VS Code adapter can map findings to ranges without re-parsing.

**D4 — Merged domain model.** `Severity` ordered `low < moderate < high < critical` with `medium → moderate` aliasing. `Ecosystem` extensible (npm first). `Finding` = `Vulnerability` + `Occurrence` + `FixHint` + `scanner`. `ScanResult` carries `apiVersion`, `status`, `findings`, `issues`, `stats`, `meta`. *Why:* one normalized shape all scanners emit and all hosts consume. Invariants: findings returned to hosts are already policy-filtered; engine never mutates manifests or runs installs.

**D5 — `jsonc-parser` AST for npm manifest parsing.** Parse `package.json` to an AST and compute `line`/`charStart`/`charEnd` for each dependency version string. *Why:* survives JSONC/comments, yields exact editor ranges for Diagnostics without a second parse. *Alternative:* regex — rejected (fragile, no positions).

**D6 — Fail-soft to `ScanIssue`, never throw for findings.** Operational problems (network disabled/failed, parse failure, timeout, cancellation) become `issues[]` + `status: degraded|failed`; `scan()` throws only for programmer misuse. Stable error codes: `NETWORK_DISABLED`, `NETWORK_FAILED`, `PARSE_FAILED`, `TIMEOUT`, `CANCELLED`, `UNSUPPORTED_ECOSYSTEM`, `INTERNAL`.

**D7 — In-memory LRU cache keyed by content hash + policy fingerprint.** Key material: `ENGINE_API_VERSION`, policy semantic fields, sorted content hashes of manifests in scope, scanner id + version tag. `status: failed` is not cached. *Why:* rescans on file switch are fast; no disk persistence needed for the slice.

**D8 — Policy: `minSeverity` (default `moderate`) + `allowNetwork`.** Only orchestrator applies policy; adapters return unfiltered normalized findings. *Why:* single filtering place, counts agree across UI. Ignores/directOnly/ecosystem-enablement deferred.

**D9 — Package boundary enforcement via tsconfig path restrictions + lint.** `engine/tsconfig.json` forbids resolving `vscode`; `vscode` imports `@vulnlens/engine` + `vscode` only. *Why:* keeps the contract honest and the engine host-agnostic.

**D10 — Workspace Trust gate lives in the host.** Engine exposes `allowNetwork`; the VS Code adapter refuses auto-scan on untrusted workspaces and emits `WORKSPACE_UNTRUSTED` as a host-side `ScanIssue`. *Why:* trust is a host concept; engine stays host-agnostic.

## Risks / Trade-offs

- **OSV range/version queries are noisier without lockfile-resolved versions** → mitigation: document the limitation; clean `^`/`~`/`>=` before querying; lockfile parsing is the next change. UI must still show what OSV returns (no hiding).
- **Network dependency for the MVP** → mitigation: `allowNetwork: false` local-only mode degrades to `status: degraded` with `NETWORK_DISABLED` issue and zero findings; status bar surfaces this.
- **AST position mapping bugs misplace Diagnostics** → mitigation: unit tests with fixtures (vulnerable, clean, malformed, JSONC-with-comments); VS Code mapping tests assert ranges against fixture text.
- **Engine/VS Code boundary drift over time** → mitigation: tsconfig restriction + an import-boundary lint rule + a test that asserts no `vscode` import in `engine/src`.
- **Combined foundation+MVP change is large** → mitigation: tasks ordered foundation-first then vertical slice; MVP exit criteria are explicit (moderate+ findings in Problems, disk untouched, counts match engine).
- **API versioning forgotten as scope grows** → mitigation: `ENGINE_API_VERSION` constant exported and asserted in tests; `versioning.md` documents the break-the-API process.

## Migration Plan

Greenfield — no migration. Rollback is deleting `packages/*`, `docs/`, and the OpenSpec project docs added by this change; the `openspec/changes/` artifact stays as a record.

## Open Questions

- **Lockfile parsing scope**: parse `package-lock.json` v3 for resolved versions within this change, or defer entirely? *Lean:* defer; query OSV with the cleaned manifest version for the MVP, document the noise trade-off in `docs/core/scanners.md`.
- **OSV batch vs per-package queries**: use OSV batch (`/v1/querybatch`) to reduce round-trips, or one query per dependency for the MVP? *Lean:* per-package for simplicity in the slice, switch to batch in the performance phase.
- **Ignore storage location**: VS Code settings (`vulnlens.ignores`) vs a `.vulnlensignore` file? *Deferred to the policy change* — not blocking this slice; engine `IgnoreRule` type is defined now, evaluation is not.
