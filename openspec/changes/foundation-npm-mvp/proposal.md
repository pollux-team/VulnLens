## Why

Developers learn about vulnerable dependencies late — in CI, via Dependabot, or through manual audits. The feedback is noisy, ecosystem-siloed, and disconnected from the files they actually edit. Nothing exists in this repo yet: no packages, no contract docs, no ADRs. This change establishes the VulnLens contract (docs, architecture decisions, skeleton) **and** ships the first working vertical slice — npm manifests → OSV intel → in-editor Diagnostics + Status Bar — so the central-engine architecture is proven end-to-end before adding breadth (more ecosystems, CLI, cache polish).

## What Changes

- **Repo skeleton**: pnpm monorepo with `packages/engine` (host-agnostic core) and `packages/vscode` (thin presentation adapter); stub `packages/cli` reserved for later.
- **Contract docs** (`docs/core/*`): domain-model, api, scanners, policy, cache, errors, versioning — the stable public contract hosts may depend on.
- **OpenSpec project docs**: `project.md`, `glossary.md`, `architecture.md`, `security.md` + ADRs 001–008 (no manifest mutation, lockfile source of truth, normalized model, central engine, default severity moderate, workspace trust, TypeScript core, npm-audit + OSV).
- **Engine core**: domain types, `ENGINE_API_VERSION = "1"`, `createEngine()`, `scan(ScanRequest)`, `detect()`, `applyPolicy()`, `getSeverityRank()`, `ScanResult`/`ScanIssue`, in-memory cache.
- **Scanner port + adapters**: npm manifest parser (`package.json` → `ParsedDependency` with line/column locations via `jsonc-parser`) and an OSV adapter (`api.osv.dev`, `allowNetwork`-gated, fail-soft). OSV is the primary intel source for the MVP (cross-ecosystem); `npm audit` is deferred.
- **Policy**: `minSeverity` gate (default `moderate`), `allowNetwork` flag; ignores/directOnly deferred to a later change.
- **VS Code extension**: `vulnlens.scan` command, config keys (`minSeverity`, `autoScanOnOpen`, `allowNetwork`), Diagnostics mapped to `package.json` dependency lines, Status Bar counts by severity, Workspace Trust gate for auto-scan, progress + cancellation.
- **Package boundary enforcement**: `engine` may not import `vscode`; enforced via tsconfig path restrictions.

## Capabilities

### New Capabilities

- `engine-core`: Central host-agnostic engine — domain model, `createEngine`/`scan`/`detect`/`applyPolicy` public API, `ScanResult`/`ScanIssue`, severity ranking, in-memory cache, `ENGINE_API_VERSION`.
- `scanners`: Scanner port and the two MVP adapters — npm manifest parser (with editor location data) and OSV vulnerability adapter (`allowNetwork`-gated, fail-soft to `ScanIssue`).
- `vscode-host`: VS Code presentation adapter — `vulnlens.scan` command, config → `Policy` mapping, Diagnostics on dependency lines, Status Bar severity counts, Workspace Trust gate, progress/cancellation.
- `project-foundation`: Monorepo layout, `docs/core` contract, OpenSpec project docs (project/glossary/architecture/security), ADRs 001–008, and enforceable package boundary rules.

### Modified Capabilities

_None — greenfield repository, no existing specs in `openspec/specs/`._

## Impact

- **New code**: `packages/engine/src/**` (types, orchestrator, policy, cache, scanners/npm, scanners/osv) and `packages/vscode/src/**` (extension, commands, config, mapping, providers, views).
- **New docs**: `docs/core/{README,overview,domain-model,api,scanners,policy,cache,errors,versioning}.md`, `docs/hosts/vscode.md`, `openspec/{project,glossary,architecture,security}.md`, `openspec/decisions/ADR-001..008.md`.
- **New dependencies**: `zod`, `semver`, `jsonc-parser`, `lru-cache` (engine); `@types/vscode`, `esbuild` (vscode). Runtime: Node.js LTS.
- **Public API established**: Engine API v1. Future changes that alter `ScanResult`/`scan()` semantics must bump the documented version and update `docs/core` in the same change.
- **No existing code affected** (greenfield). No on-disk manifest mutation; engine never runs install/upgrade commands.
- **Boundary rule**: `engine` tsconfig forbids `vscode` imports; `vscode` imports `engine` + `vscode` only.
