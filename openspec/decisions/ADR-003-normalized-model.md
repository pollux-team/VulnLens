# ADR-003: Normalized Model

## Context

Different ecosystems (npm, PyPI, Go) have different vulnerability data formats, severity scales, and advisory ID systems. Hosts need a single consistent model to render UI.

## Decision

All scanners SHALL normalize their output into the VulnLens domain model (`Finding`, `Vulnerability`, `Occurrence`, `ScanResult`). Severity aliases (e.g., npm `medium` → `moderate`) are applied during normalization. Hosts consume only the normalized model.

## Consequences

- **Positive**: Hosts implement UI once; new ecosystems are added by writing scanners, not UI code.
- **Negative**: Normalization logic lives in scanners; bugs in normalization affect all hosts.
- **Mitigation**: Scanner tests validate normalization; domain model is documented in `docs/core/domain-model.md`.
