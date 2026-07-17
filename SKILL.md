# VulnLens — AI Agent Skill Guide

## Project Overview

VulnLens is a VS Code extension + engine library for real-time dependency vulnerability scanning. It queries the OSV database and npm registry to show CVSS scores, version health, and upgrade suggestions inline in the editor.

## Architecture

```
packages/
├── engine/           # Host-agnostic core (Node.js, no VS Code dependency)
│   ├── src/
│   │   ├── index.ts          # Public API barrel
│   │   ├── engine.ts         # createEngine(), scan()
│   │   ├── schemas.ts        # Zod domain types (Severity, Finding, etc.)
│   │   ├── detect.ts         # Find package.json files
│   │   ├── policy.ts         # Severity filtering
│   │   ├── cache.ts          # LRU cache
│   │   ├── severity.ts       # normalizeSeverity(), getSeverityRank()
│   │   ├── health/           # Dependency health advisor
│   │   │   ├── registry.ts   # npm registry queries
│   │   │   ├── vulnerability.ts  # OSV batch queries
│   │   │   └── advisor.ts    # checkPackageHealth()
│   │   └── scanners/
│   │       ├── port.ts       # Scanner interface
│   │       ├── npm.ts        # package.json parser
│   │       ├── osv.ts        # OSV API adapter
│   │       └── parse-npm-manifest.ts  # JSONC manifest parser
│   └── tests/fixtures/       # Test fixture package.json files
├── vscode/           # VS Code extension (thin presentation layer)
│   ├── src/
│   │   ├── extension.ts      # activate(), commands, event handlers
│   │   ├── code-lens.ts      # Vulnerability CodeLens
│   │   ├── health-lens.ts    # Health status CodeLens
│   │   ├── health-inline.ts  # Inline decorations (colored badges)
│   │   ├── diagnostics.ts    # Map findings → VS Code diagnostics
│   │   ├── status-bar.ts     # Severity counts in status bar
│   │   ├── version-popover.ts # QuickPick version selector
│   │   ├── finding-panel.ts  # Webview for vulnerability details
│   │   ├── cancel.ts         # CancellationToken → AbortSignal
│   │   ├── config/policy.ts  # VS Code settings → Policy
│   │   ├── mapping/range.ts  # Occurrence → VS Code Range
│   │   └── trust.ts          # Workspace Trust gate
│   └── esbuild.mjs           # Bundle config (CJS output)
└── cli/              # CLI stub (reserved)
```

## Key Conventions

### TypeScript 7 — Zero Explicit Types

```ts
// CORRECT — inference only
const items = []
const result = FindingSchema.parse(data)

// WRONG — explicit type annotation
const items: string[] = []
function scan(req: ScanRequest): Promise<ScanResult> { }
```

**Exception:** Empty arrays require type annotation in TS7:
```ts
const items: string[] = []  // Required — [] alone infers as never[]
const findings: any[] = []
```

### Testing

- Tests live next to source: `engine.ts` → `engine.test.ts`
- Use `vitest` (`describe`, `it`, `expect`, `vi.fn()`)
- Mock network calls — never hit real APIs in tests
- Run: `pnpm test` (all packages) or `pnpm --filter @vulnlens/engine test`

### Package Boundaries

- `engine` → NO imports from `vscode`
- `vscode` → imports only `@vulnlens/engine` + `vscode`
- Enforced by `tsconfig.json` path restrictions + boundary test

### Zod Schemas

All domain types are Zod schemas in `packages/engine/src/schemas.ts`:
```ts
export const FindingSchema = z.object({
  id: z.string(),
  vulnerability: VulnerabilitySchema,
  occurrence: OccurrenceSchema,
  fix: FixHintSchema.nullable(),
  scanner: z.string(),
})
```

Use `.parse()` to validate data, `.array()` for collections.

## Common Tasks

### Add a new scanner

1. Create `packages/engine/src/scanners/my-scanner.ts`
2. Implement `supports(detection)` and `scan(ctx)` methods
3. Export from `packages/engine/src/index.ts`
4. Add to `createEngine()` default scanners in `engine.ts`
5. Write tests in `my-scanner.test.ts`

### Add a VS Code command

1. Add to `contributes.commands` in `packages/vscode/package.json`
2. Register handler in `extension.ts` with `vscode.commands.registerCommand()`
3. Push to `context.subscriptions`

### Modify engine public API

1. Update the function in `packages/engine/src/`
2. Export from `packages/engine/src/index.ts`
3. Update `docs/core/api.md` in the same change
4. Update `docs/core/domain-model.md` if types changed

### Fix type errors

Most TS7 errors are `never[]` from empty arrays:
```ts
// Fix: add type annotation
const items: string[] = []
const data: any[] = []
const lenses: vscode.CodeLens[] = []
```

## File Structure Quick Reference

| File | Purpose |
|------|---------|
| `engine.ts` | `createEngine()`, `scan()` — main orchestrator |
| `schemas.ts` | All Zod types, `ENGINE_API_VERSION`, helpers |
| `health/advisor.ts` | `checkPackageHealth()` — combined health data |
| `health/registry.ts` | `fetchNpmMetadata()` — npm API with cache |
| `health/vulnerability.ts` | `queryVulnerabilityScores()` — OSV batch queries |
| `extension.ts` | VS Code activation, commands, event wiring |
| `health-lens.ts` | Clickable CodeLens for version picker |
| `health-inline.ts` | Colored inline decorations |
| `version-popover.ts` | QuickPick version selector |
| `finding-panel.ts` | Webview for vulnerability details |

## Running & Testing

```bash
pnpm install          # Install all dependencies
pnpm build            # Build engine (tsc) + vscode (esbuild)
pnpm typecheck        # Typecheck all packages
pnpm test             # Run all tests (52 tests)
pnpm --filter @vulnlens/engine test    # Engine tests only
```

## API Surface

```ts
// Engine core
import { createEngine, checkPackageHealth, fetchNpmMetadata } from '@vulnlens/engine'

// Create engine
const engine = createEngine({ fetchImpl: myFetch })

// Scan for vulnerabilities
const result = await engine.scan({
  roots: ['./'],
  policy: { minSeverity: 'moderate', allowNetwork: true },
})

// Check dependency health
const health = await checkPackageHealth('./package.json')
// → [{ name, currentVersion, latest, cvssScore, deprecated, versions, ... }]
```
