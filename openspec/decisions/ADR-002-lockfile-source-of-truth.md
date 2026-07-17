# ADR-002: Lockfile Source of Truth

## Context

Dependencies can be specified as ranges in `package.json` (e.g., `^4.17.19`) but resolved to exact versions in lockfiles (e.g., `4.17.21`). Vulnerability data is most accurate when queried against resolved versions.

## Decision

When a lockfile is present, the engine SHALL use the resolved version from the lockfile as the source of truth for vulnerability queries. When no lockfile exists, the engine SHALL use the cleaned manifest version (range prefix removed) and document the increased noise.

## Consequences

- **Positive**: More accurate vulnerability matching when lockfiles exist.
- **Negative**: Without lockfiles, queries may match vulnerabilities that don't apply to the exact installed version.
- **Mitigation**: Document the noise trade-off; lockfile parsing is a priority for early implementation.
