# VulnLens — Project Overview

## One-liner

Local-first dependency risk engine with editor adapters that surface **moderate+** vulnerabilities **in context** across ecosystems — without rewriting manifests on disk.

## Problem

Developers learn about vulnerable packages late (CI, Dependabot, manual audit). Feedback is noisy, ecosystem-siloed, and disconnected from the files they edit.

## Solution

- Detect dependency manifests and lockfiles in the workspace
- Scan via pluggable adapters (npm first, OSV universal, then more)
- Normalize into one model
- Show results in VS Code/Cursor: Problems, CodeLens, Hover, Tree, Status Bar, Webview, virtual annotated view
- Same engine later powers CLI/CI

## Non-goals

- Replace enterprise SCA (Snyk, GHAS, etc.)
- Auto-upgrade dependencies without explicit user action
- Permanent `// comments` inside real `package.json`
- Perfect zero false-negatives across all ecosystems
- Cloud account required for core features

## Default Product Policy

| Setting | Default |
|---------|---------|
| Min severity | `moderate` |
| Auto-scan | on open (trusted workspaces only) |
| Annotate disk manifests | never |
| Lockfile | source of truth for resolved versions |
| Telemetry | none (v1) |
| Network | OSV allowed when enabled; local-tools-only mode available |

## Success Metrics

- Time-to-first-finding after opening a repo
- Zero destructive writes to manifests
- Diagnostics count === engine findings (for same policy)
- Cancel works on long scans
- Second ecosystem added **without** VS Code diagnostic rewrite
- Core docs updated in same change as API changes (process metric)
