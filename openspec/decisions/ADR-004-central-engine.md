# ADR-004: Central Engine

## Context

Multiple hosts (VS Code, CLI, future CI) need vulnerability data. Duplicating scanner/policy/cache logic in each host leads to drift and inconsistent results.

## Decision

VulnLens uses a central host-agnostic engine (`@vulnlens/engine`) that owns all scanning, normalization, policy evaluation, and caching. Hosts are thin presentation adapters that call `engine.scan()` and render the `ScanResult`.

## Consequences

- **Positive**: Consistent results across hosts; single place to fix bugs; engine can be tested independently.
- **Negative**: Engine must be host-agnostic (no `vscode` imports); hosts cannot customize scanning logic.
- **Mitigation**: Engine exposes injectable options (`fetchImpl`, `runCommand`, `scanners`) for host-specific needs.
