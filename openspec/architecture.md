# VulnLens — Architecture

## Diagram

```
Hosts (VS Code / CLI / future)
        │
        ▼
   CENTRAL ENGINE
   (detect, scan, normalize,
    policy, cache, report shape)
        │
        ▼
  Scanner Adapters
  (npm-manifest, osv, ...)
```

## Ownership

| Component | Owns | Must not own |
|-----------|------|-------------|
| Engine | Findings, severity ranking, ignores, cache, report shapes | UI rendering, editor ranges, terminal output |
| VS Code | Diagnostics, CodeLens, Hover, Tree, Webview, StatusBar | Severity normalization, scanner logic, policy evaluation |
| CLI (future) | Terminal output, exit codes | Severity normalization, scanner logic |
| Scanners | External format → domain `Finding` normalization | Policy filtering (orchestrator does this) |

## Package Boundaries

| Package | May import | Must not import |
|---------|-----------|-----------------|
| `packages/engine` | Node std, zod, semver, jsonc-parser, lru-cache, undici | `vscode` |
| `packages/vscode` | `@vulnlens/engine`, `vscode`, Node std | Scanner internals, raw audit shapes |
| `packages/cli` (future) | `@vulnlens/engine`, Node std | `vscode` |
