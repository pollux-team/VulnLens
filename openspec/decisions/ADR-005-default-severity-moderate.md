# ADR-005: Default Severity Moderate

## Context

Showing all vulnerabilities (including `low`) creates noise that developers ignore. Showing only `high`+ misses moderate issues that may be exploitable.

## Decision

The default `minSeverity` is `moderate`. Findings below this threshold are filtered out by the policy layer before reaching hosts. Users can configure this via `vulnlens.minSeverity`.

## Consequences

- **Positive**: Reduces noise while keeping actionable moderate vulnerabilities visible.
- **Negative**: Some low-severity issues are hidden by default.
- **Mitigation**: Users can lower the threshold to `low` if needed; the engine always has the full data.
