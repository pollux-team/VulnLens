# VulnLens Technical Standard

All contributors — human or AI — **MUST** follow these rules when writing code for this project.

---

## 1. TypeScript Version

**Mandatory: TypeScript 7 (latest)**

- Pin `typescript` to `^7.0.0` in every package's `devDependencies`.
- Use `tsc` from this version for type-checking and compilation.
- Never downgrade or skip patches — update to the latest 7.x release as soon as it ships.
- `tsconfig.json` in every package SHALL set `"target"`, `"module"`, and `"moduleResolution"` to values that TypeScript 7 supports and recommends (check the release notes when upgrading).
- `strict: true` is always enabled.

---

## 2. Zero Explicit Types

**Never write a type annotation, type parameter, type alias, interface, or `as` cast in application code.**

This means:

- No `const x: string = ...`
- No `function foo(a: number): boolean`
- No `interface` or `type` declarations in `.ts` files under `src/`
- No `as SomeType` casts
- No return type annotations on functions
- No parameter type annotations on functions

**Rely entirely on TypeScript inference.** The compiler knows what the code does — let it figure it out.

**Where types ARE allowed (TypeScript 7 exception — empty arrays):**

TypeScript 7 infers `never[]` for empty array literals `[]` with no contextual type. JSDoc `@type` does NOT work in `.ts` files (only `.js`). Therefore, the **only** allowed explicit type annotation is the minimal empty-array declaration:

```ts
// ALLOWED — TS7 requires this; `[]` alone infers as never[]
const items: string[] = []
const kept: any[] = []
const ids: { system: string; value: string }[] = []
```

This is the **sole exception**. No other type annotations are permitted in application code.

**Where types ARE allowed (other):**

- `.d.ts` declaration files (third-party shim files you don't own)
- `tsconfig.json` compiler options

**How to verify compliance:**

```bash
# Allowed: `const x: Type[] = []` pattern for empty arrays only
# Not allowed: function param types, return types, variable types (except empty array init)
grep -rn ': [A-Z]\|: string\|: number\|: boolean\|: Record\|: Partial\|: Pick\|: Omit\|: Promise\|: Array\|<\(.*\)>' packages/*/src/
# Should only match empty-array declarations
```

---

## 3. Testing

**Every new function, class, or module MUST have test cases. Tests MUST pass before merge.**

### Test Framework

- Use **vitest** (already configured in this project).
- Test files live next to their source: `src/foo.ts` → `src/foo.test.ts`.
- Run tests with: `pnpm test` from the package or repo root.

### Test Coverage Rules

| What | Minimum |
|------|---------|
| Public exported functions | At least 1 test each |
| Core business logic (scanner, policy, cache) | Branch coverage ≥ 90% |
| Edge cases | Error paths, empty inputs, network failures |
| Boundary enforcement | Test that `engine` cannot import `vscode` |

### Test Structure

```ts
import { describe, it, expect } from 'vitest'
import { createEngine } from './index'

describe('createEngine', () => {
  it('returns an engine instance', () => {
    const engine = createEngine()
    expect(engine).toBeDefined()
  })
})
```

- One `describe` block per function/module.
- One `it` block per behavioral case.
- Use `expect().toEqual()` for value comparisons, `expect().toBe()` for identity.
- Mock external calls (network, filesystem) — never hit real APIs in tests.
- Snapshot tests are acceptable for complex output shapes but prefer explicit assertions.

### CI Gate

Tests **MUST** pass in CI before any merge. The CI step is:

```bash
pnpm test
```

If a test fails, the PR is blocked — fix it before merging.

---

## 4. Code Style & Conventions

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| Files | `kebab-case.ts` | `engine-core.ts` |
| Functions | `camelCase` | `createEngine`, `applyPolicy` |
| Variables | `camelCase` | `scanResult`, `minSeverity` |
| Constants | `UPPER_SNAKE_CASE` | `ENGINE_API_VERSION` |
| Classes | `PascalCase` | `ScanResult` (only in third-party / `.d.ts`) |

### Imports

- Use ES module `import/export` syntax — never `require()`.
- Group imports: third-party → `@vulnlens/*` → relative. One blank line between groups.
- Use named exports: `export function createEngine()`. Avoid default exports.

### Error Handling

- Never throw for expected business failures — return structured error objects (`ScanIssue` with `errorCode`).
- Throw only for programmer errors (invalid arguments, invariant violations).
- Use `try/catch` around network and filesystem calls.

### File Structure

```
packages/engine/src/
├── index.ts            # public API barrel
├── engine.ts           # createEngine, scan
├── policy.ts           # applyPolicy
├── cache.ts            # LRU cache
├── scanners/
│   ├── port.ts         # Scanner port type
│   ├── npm.ts          # npm manifest parser
│   └── osv.ts          # OSV adapter
└── types/              # (empty — no explicit types; inference only)
```

---

## 5. Dependency Management

- **Package manager**: pnpm (workspace protocol).
- **Lockfile**: `pnpm-lock.yaml` is the source of truth. Never hand-edit it.
- **Engine dependencies**: `zod`, `semver`, `jsonc-parser`, `lru-cache`, `undici` (for OSV).
- **VS Code dependencies**: `@types/vscode`, `esbuild`.
- No runtime dependency may be added without updating this standard and `docs/core`.

---

## 6. Documentation Sync

- Any change to the public engine API (`createEngine`, `scan`, `ScanResult`, `ScanIssue`, `ENGINE_API_VERSION`) **MUST** update the corresponding `docs/core/*` file in the same PR.
- ADRs (`openspec/decisions/ADR-*`) are immutable once published. New decisions get a new ADR number.
- `openspec/glossary.md` MUST be updated when new domain terms (`Severity`, `Ecosystem`, etc.) are introduced.

---

## 7. Package Boundaries

| Package | May import | May NOT import |
|---------|-----------|----------------|
| `packages/engine` | `zod`, `semver`, `jsonc-parser`, `lru-cache`, `undici`, Node.js builtins | `vscode`, `packages/vscode/*` |
| `packages/vscode` | `@vulnlens/engine`, `vscode`, Node.js builtins | direct OSV/network calls, `zod`, `semver` |

Enforced by `tsconfig.json` path restrictions + a boundary test in `packages/engine/src/__tests__/boundary.test.ts`.

---

## 8. Commit Messages

Format: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`

Examples:
- `feat(engine): implement OSV scanner adapter`
- `fix(vscode): correct diagnostic range for multi-line dependencies`
- `docs(core): update api.md for ScanResult.status field`
- `test(engine): add cache hit/miss coverage`

---

## 9. AI Agent Compliance

When an AI agent (MiMoCode, Copilot, Cursor, etc.) generates code for this repo:

1. It MUST NOT emit explicit type annotations in `.ts` files under `src/`.
2. It MUST generate test files alongside source files.
3. It MUST run `pnpm test` and ensure all tests pass before marking work complete.
4. It MUST update `docs/core/*` if the public API surface changes.
5. It MUST respect package boundaries — never add a `vscode` import to `engine`.

---

*Last updated: 2026-07-17*
