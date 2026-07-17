# Engine Overview

## Responsibilities

- Detect dependency manifests and lockfiles in workspace roots
- Select and run appropriate scanners
- Normalize scanner output into domain `Finding` objects
- Apply policy (minSeverity, allowNetwork, ignores)
- Cache results keyed by content hash + policy fingerprint
- Return `ScanResult` with findings, issues, stats, and metadata

## Non-Responsibilities

- UI rendering (Diagnostics, CodeLens, Hover, Tree, Webview, StatusBar)
- Editor range mapping
- Severity visualization
- Manifest mutation or package installation
- Network trust evaluation (workspace trust is a host concept)

## Architecture

```
Hosts (VS Code / CLI / future)
        │
        ▼
   CENTRAL ENGINE
   ┌─────────────────────────┐
   │  detect → select → run  │
   │  → merge → normalize    │
   │  → policy → cache       │
   │  → return ScanResult    │
   └─────────────────────────┘
        │
        ▼
  Scanner Adapters
  (npm-manifest, osv, ...)
```
