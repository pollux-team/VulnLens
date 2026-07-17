## ADDED Requirements

### Requirement: Monorepo layout
The repository SHALL be a pnpm workspace with `packages/engine` (host-agnostic core), `packages/vscode` (VS Code extension adapter), and a `packages/cli` stub (README only, reserved for a later phase). A root `package.json`, `pnpm-workspace.yaml`, and `tsconfig.base.json` SHALL exist.

#### Scenario: Workspaces resolve
- **WHEN** `pnpm install` is run at the repo root
- **THEN** `packages/engine`, `packages/vscode`, and `packages/cli` are recognized as workspaces

### Requirement: docs/core contract present
The repo SHALL contain `docs/core/` with `README.md`, `overview.md`, `domain-model.md`, `api.md`, `scanners.md`, `policy.md`, `cache.md`, `errors.md`, and `versioning.md`. These files SHALL match the implemented public engine API and domain model.

#### Scenario: Core docs index lists all contract files
- **WHEN** a reader opens `docs/core/README.md`
- **THEN** it links to each of the nine core contract documents and states the doc/code sync rule

### Requirement: OpenSpec project docs present
The repo SHALL contain `openspec/project.md` (product vision, non-goals, default policy, success metrics), `openspec/glossary.md` (all domain terms), `openspec/architecture.md` (diagram + ownership table), and `openspec/security.md` (threat model + MUST list).

#### Scenario: Glossary covers domain enums
- **WHEN** a new term like `Severity` or `Ecosystem` is introduced
- **THEN** it is defined in `openspec/glossary.md`

### Requirement: ADRs 001–008 present
The repo SHALL contain `openspec/decisions/ADR-001` through `ADR-008` covering: no manifest mutation, lockfile source of truth, normalized model, central engine, default severity moderate, workspace trust, TypeScript core, and npm-audit + OSV. Each ADR SHALL have Context, Decision, and Consequences sections.

#### Scenario: All eight ADRs exist
- **WHEN** `openspec/decisions/` is listed
- **THEN** ADR-001 through ADR-008 are all present and each has Context/Decision/Consequences

### Requirement: Enforceable package boundaries
`packages/engine/tsconfig.json` SHALL forbid resolving the `vscode` module. A boundary test SHALL assert that no file under `packages/engine/src` imports from `vscode`. `packages/vscode` SHALL depend on `@vulnlens/engine` and `vscode` only.

#### Scenario: Engine tsconfig rejects vscode
- **WHEN** the engine package compiles a file that imports `vscode`
- **THEN** the compilation fails due to path restrictions

### Requirement: Core docs sync rule
Any change that alters public engine types or functions SHALL update the affected `docs/core/*` file(s) in the same change. New scanners SHALL update `docs/core/scanners.md` and the glossary ecosystem list. New error/degraded modes SHALL update `docs/core/errors.md`.

#### Scenario: Public API change updates docs
- **WHEN** a change adds a field to `ScanResult`
- **THEN** `docs/core/domain-model.md` and `docs/core/api.md` are updated in that same change

### Requirement: Stub packages compile and activate
`packages/engine` SHALL export `createEngine`, the public types, and `ENGINE_API_VERSION` (a stub returning an empty `ScanResult` is acceptable only before the MVP slice lands; the MVP slice SHALL provide a working `scan`). `packages/vscode` SHALL activate and log a "VulnLens ready" message. TypeScript strict mode SHALL be enabled in all packages.

#### Scenario: Engine stub exports the public surface
- **WHEN** a host imports `@vulnlens/engine`
- **THEN** `createEngine`, `ENGINE_API_VERSION`, and the domain types are exported

#### Scenario: Extension activates
- **WHEN** the VS Code extension is activated in a trusted workspace
- **THEN** it logs that VulnLens is ready without errors
