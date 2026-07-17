# VulnLens

**Real-time dependency vulnerability scanning for VS Code.**

VulnLens scans your `package.json` dependencies against the [OSV](https://osv.dev/) database and shows vulnerabilities, CVSS scores, and upgrade suggestions — directly in your editor.

![VulnLens Demo](https://img.shields.io/badge/status-MVP-green) ![TypeScript](https://img.shields.io/badge/TypeScript-7-blue) ![License](https://img.shields.io/badge/license-MIT-yellow)

---

## Features

- **Inline vulnerability scores** — CVSS scores appear color-coded next to each dependency
- **One-click version picker** — click to see version history and upgrade instantly
- **Dependency health advisor** — shows latest version, deprecated status, and available updates
- **VS Code Diagnostics** — vulnerabilities appear as problems in the Problems panel
- **Status bar** — severity counts at a glance
- **Workspace Trust** — respects VS Code's trust model
- **Policy engine** — filter by minimum severity (low/moderate/high/critical)

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run typecheck
pnpm typecheck

# Run tests
pnpm test
```

### Use in VS Code

1. Open this project in VS Code
2. Press `F5` to launch the Extension Development Host
3. Open a project with a `package.json`
4. Run **VulnLens: Scan Workspace** from the command palette (`Cmd+Shift+P`)

### Use from CLI

```js
import { createEngine } from '@vulnlens/engine'

const engine = createEngine()
const result = await engine.scan({
  roots: ['./'],
  policy: { allowNetwork: true, minSeverity: 'low' },
})

console.log(`Found ${result.stats.findingCount} vulnerabilities`)
result.findings.forEach(f => {
  console.log(`  ${f.occurrence.package.name} — ${f.vulnerability.severity}: ${f.vulnerability.title}`)
})
```

## Architecture

```
VulnLens/
├── packages/
│   ├── engine/          # Host-agnostic core (scan, detect, policy, health)
│   ├── vscode/          # VS Code extension adapter
│   └── cli/             # CLI stub (reserved)
├── docs/core/           # Core contract documentation
├── openspec/            # Project specs, ADRs, and change proposals
└── TECHNICAL_STANDARD.md
```

### Engine (`@vulnlens/engine`)

The core library. Works in any JavaScript environment (VS Code, Node.js, Deno, Bun).

**Public API:**
- `createEngine(options)` — create a scan engine
- `engine.scan(request)` — scan for vulnerabilities
- `detect(roots)` — find package manifests
- `checkPackageHealth(manifestPath)` — dependency health + CVSS scores
- `fetchNpmMetadata(name)` — npm registry queries
- `queryVulnerabilityScores(name, versions)` — OSV batch queries

See [docs/core/api.md](docs/core/api.md) for full API reference.

### VS Code Extension

Presentation layer. Maps engine findings to VS Code Diagnostics, Status Bar items, CodeLens, and inline decorations.

**Commands:**
- `VulnLens: Scan Workspace` — trigger a scan
- `VulnLens: Clear Cache` — clear cached results
- `VulnLens: Show Finding Details` — open vulnerability webview

**Settings:**
- `vulnlens.minSeverity` — minimum severity to display (default: `moderate`)
- `vulnlens.autoScanOnOpen` — auto-scan when package.json is opened (default: `true`)
- `vulnlens.allowNetwork` — allow OSV network requests (default: `true`)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 7 (strict, zero explicit types) |
| Runtime | Node.js 22+ |
| Package Manager | pnpm workspaces |
| Validation | Zod schemas |
| Testing | Vitest |
| Bundling | esbuild |
| Vulnerability DB | OSV API |
| Registry | npm registry |

## Development

```bash
# Watch mode (engine)
pnpm --filter @vulnlens/engine test:watch

# Watch mode (vscode)
pnpm --filter @vulnlens/vscode test:watch

# Build everything
pnpm build

# Typecheck everything
pnpm typecheck
```

## Contributing

See [TECHNICAL_STANDARD.md](TECHNICAL_STANDARD.md) for coding conventions.

Key rules:
- **TypeScript 7** with `strict: true`
- **Zero explicit types** (inference only, except empty arrays)
- **Tests required** — co-located with source (`foo.ts` → `foo.test.ts`)
- **Engine is host-agnostic** — never import `vscode` in engine

## License

MIT
