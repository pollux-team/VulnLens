# foundation-npm-mvp — remaining work

Verification found tasks.md over-checked. This TODO is the source of truth for finishing the MVP to `TECHNICAL_STANDARD.md`.

**Standards (mandatory):**
- TypeScript 7, `strict: true`
- Zero explicit types in `src/**/*.ts` (inference only; no `interface`/`type`/`as`/param-return annotations)
- Tests next to source (`foo.ts` → `foo.test.ts`); mock network; never hit real APIs
- Engine ↛ `vscode`; VS Code imports only `@vulnlens/engine` + `vscode`
- Public API changes update `docs/core/*` in the same change

---

## P0 — Runtime & tooling (blockers)

- [ ] P0.1 Fix `normalizeSeverity` export/import (engine cannot load under Node ESM today)
- [ ] P0.2 Convert engine from `.js` + JSDoc to real `.ts` (delete `.js` sources)
- [ ] P0.3 Make `pnpm typecheck` pass across packages
- [ ] P0.4 Fix pnpm `allowBuilds` so `pnpm test` / `pnpm typecheck` work from root
- [ ] P0.5 Ensure `packages/engine` builds to `dist/` and package `exports` match

## P1 — Engine core (TECHNICAL_STANDARD layout)

- [ ] P1.1 `schemas.ts` — Zod domain + defaults (no type aliases)
- [ ] P1.2 `severity.ts` — `getSeverityRank`, `normalizeSeverity` (medium → moderate)
- [ ] P1.3 `policy.ts` — pure `applyPolicy` (minSeverity gate)
- [ ] P1.4 `cache.ts` — LRU store + `buildCacheKey` (do not mutate input arrays)
- [ ] P1.5 `detect.ts` — find package.json + note lockfiles
- [ ] P1.6 `scanners/port.ts` — scanner shape helpers / context factory (no interfaces)
- [ ] P1.7 `scanners/npm.ts` — jsonc AST locations; fail-soft `PARSE_FAILED`
- [ ] P1.8 `scanners/osv.ts` — honor `fetchImpl`; `NETWORK_*` / `TIMEOUT` / `CANCELLED`; no policy filter
- [ ] P1.9 `engine.ts` — `createEngine` with injectable scanners/cache/clock/fetchImpl; default scanners
- [ ] P1.10 `index.ts` — public barrel (`ENGINE_API_VERSION`, createEngine, scanners, helpers)
- [ ] P1.11 Fail-soft status: `NETWORK_DISABLED` → `degraded` (not failed); never throw for findings
- [ ] P1.12 Cancellation: honor `signal`, emit `CANCELLED` + partial findings
- [ ] P1.13 Cache: never cache `status: failed`; refresh `scannedAt` on hit; full key material

## P2 — Engine tests (required coverage)

- [ ] P2.1 `severity.test.ts`, `policy.test.ts`, `cache.test.ts`
- [ ] P2.2 `scanners/npm.test.ts` — four sections, JSONC, malformed, locations
- [ ] P2.3 `scanners/osv.test.ts` — mock `fetchImpl` only (no real network)
- [ ] P2.4 `engine.test.ts` — shape, degraded/failed, CANCELLED, cache hit, no-cache-failed, allowNetwork
- [ ] P2.5 `detect.test.ts`
- [ ] P2.6 `boundary.test.ts` — scan all engine source (`.ts`); assert no `vscode` import

## P3 — VS Code host

- [ ] P3.1 `config/policy.ts` — settings → Policy (host-only)
- [ ] P3.2 `cancel.ts` — CancellationToken → AbortSignal
- [ ] P3.3 `mapping/range.ts` — occurrence → Range
- [ ] P3.4 Diagnostics: one per finding; clear when zero findings
- [ ] P3.5 Status bar: severity counts + degraded/failed
- [ ] P3.6 Progress UI with cancellation
- [ ] P3.7 Workspace trust: suppress auto-scan; surface `WORKSPACE_UNTRUSTED`
- [ ] P3.8 Auto-scan on open: trusted only, debounced
- [ ] P3.9 Import scanners only from `@vulnlens/engine` (no deep paths)
- [ ] P3.10 Mapping tests for ranges / diagnostic count

## P4 — Docs, samples, tasks truth

- [ ] P4.1 Sync `docs/core/*` if public surface changes
- [ ] P4.2 Samples present and usable for manual QA
- [ ] P4.3 Update `tasks.md` checkboxes to match reality after work
- [ ] P4.4 Final: `pnpm typecheck` + `pnpm test` green

---

## Done criteria

1. `node -e "import('@vulnlens/engine')"` works after build (or via package exports)
2. `pnpm typecheck` exit 0
3. `pnpm test` exit 0 (no real network in tests)
4. Grep for explicit types under `packages/*/src/**/*.ts` is clean (per standard)
5. Boundary test fails if engine imports `vscode`
6. Extension wires config, mapping, trust, diagnostics clear, debounce

## Progress log

| Date | Note |
|------|------|
| 2026-07-17 | TODO created from verification; implementation starting at P0 |
