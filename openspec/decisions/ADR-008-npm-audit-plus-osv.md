# ADR-008: OSV-First for MVP (npm audit Later)

## Context

For the MVP, we need a vulnerability intel source. Options are `npm audit` (spawns a process, requires lockfile, npm-only) or OSV API (HTTP, cross-ecosystem, works without lockfile).

## Decision

The MVP uses OSV (`api.osv.dev`) as the primary vulnerability intel source. `npm audit` is deferred to a later scanner. OSV is queried per package@version with cleaned manifest versions.

## Consequences

- **Positive**: No process spawn, cross-ecosystem from day one, works without lockfile, single normalization path.
- **Negative**: OSV queries by manifest range/noise are noisier than lockfile-resolved queries; requires network.
- **Mitigation**: `allowNetwork` policy gate; lockfile parsing added later; `npm audit` added as alternative scanner.
